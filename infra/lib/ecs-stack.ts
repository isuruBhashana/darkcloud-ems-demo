import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface EcsConstructProps {
  environment: string;
  vpc: ec2.IVpc;
  frontendSecurityGroup: ec2.SecurityGroup;
  backendSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
  dbInstance: rds.DatabaseInstance;
  dbCredentials: rds.DatabaseSecret;
}

/**
 * EcsConstruct — ECS Cluster, Internal ALB, Frontend + Backend Fargate services.
 *
 * Architecture mapping:
 *   Internal ALB → /api/* → Backend Fargate (port 3000)
 *                → /*     → Frontend Fargate (port 80)
 */
export class EcsConstruct extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly frontendRepository: ecr.Repository;
  public readonly backendRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    // ── ECR Repositories ──
    this.frontendRepository = new ecr.Repository(this, 'FrontendRepo', {
      repositoryName: `darkcloud-${props.environment}-frontend`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        {
          maxImageCount: 5,
          description: 'Keep only 5 most recent images',
        },
      ],
    });

    this.backendRepository = new ecr.Repository(this, 'BackendRepo', {
      repositoryName: `darkcloud-${props.environment}-backend`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        {
          maxImageCount: 5,
          description: 'Keep only 5 most recent images',
        },
      ],
    });

    // ── ECS Cluster ──
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `darkcloud-${props.environment}`,
      vpc: props.vpc,
      containerInsightsV2: ecs.ContainerInsights.ENHANCED,
    });

    // ── Internal Application Load Balancer ──
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'InternalAlb', {
      loadBalancerName: `darkcloud-${props.environment}-alb`,
      vpc: props.vpc,
      internetFacing: false, // INTERNAL — not exposed to internet
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: props.albSecurityGroup,
    });

    const listener = this.alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    // ── Build DATABASE_URL from RDS secret ──
    // The secret contains: host, port, username, password, dbname
    const dbHost = props.dbInstance.instanceEndpoint.hostname;
    const dbPort = props.dbInstance.instanceEndpoint.port.toString();

    // ── Frontend Fargate Service ──
    const frontendTaskDef = new ecs.FargateTaskDefinition(this, 'FrontendTaskDef', {
      family: `darkcloud-${props.environment}-frontend`,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const frontendLogGroup = new logs.LogGroup(this, 'FrontendLogs', {
      logGroupName: `/ecs/darkcloud-${props.environment}/frontend`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    frontendTaskDef.addContainer('frontend', {
      containerName: 'frontend',
      image: ecs.ContainerImage.fromEcrRepository(this.frontendRepository, 'latest'),
      portMappings: [{ containerPort: 80, protocol: ecs.Protocol.TCP }],
      logging: ecs.LogDriver.awsLogs({
        logGroup: frontendLogGroup,
        streamPrefix: 'frontend',
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'wget -qO- http://localhost/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(10),
      },
    });

    const frontendService = new ecs.FargateService(this, 'FrontendService', {
      serviceName: `darkcloud-${props.environment}-frontend`,
      cluster: this.cluster,
      taskDefinition: frontendTaskDef,
      desiredCount: 0, // Set to 0 for initial stack provision; scale to 1 after image push
      minHealthyPercent: 0,
      maxHealthyPercent: 200,
      circuitBreaker: { enable: true, rollback: false },
      securityGroups: [props.frontendSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
    });

    // ── Backend Fargate Service ──
    const backendTaskDef = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
      family: `darkcloud-${props.environment}-backend`,
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    const backendLogGroup = new logs.LogGroup(this, 'BackendLogs', {
      logGroupName: `/ecs/darkcloud-${props.environment}/backend`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backendContainer = backendTaskDef.addContainer('backend', {
      containerName: 'backend',
      image: ecs.ContainerImage.fromEcrRepository(this.backendRepository, 'latest'),
      portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
      logging: ecs.LogDriver.awsLogs({
        logGroup: backendLogGroup,
        streamPrefix: 'backend',
      }),
      environment: {
        PORT: '3000',
        NODE_ENV: 'production',
        BETTER_AUTH_SECRET: 'darkcloud-production-secret-key-32-chars-min-length',
        BETTER_AUTH_URL: `http://${this.alb.loadBalancerDnsName}`,
        CORS_ORIGIN: '*', // Cloudflare handles auth; override with your domain
        DB_HOST: dbHost,
        DB_PORT: dbPort,
        DB_NAME: 'darkcloud_ems',
      },
      secrets: {
        // Inject credentials from Secrets Manager at runtime
        DB_USERNAME: ecs.Secret.fromSecretsManager(props.dbCredentials, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbCredentials, 'password'),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'wget -qO- http://localhost:3000/api/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(30),
      },
    });

    // DATABASE_URL is constructed at application startup from individual DB_* env vars
    // See backend main.ts — avoids CloudFormation ${} interpolation issues

    const backendService = new ecs.FargateService(this, 'BackendService', {
      serviceName: `darkcloud-${props.environment}-backend`,
      cluster: this.cluster,
      taskDefinition: backendTaskDef,
      desiredCount: 0, // Set to 0 for initial stack provision; scale to 1 after image push
      minHealthyPercent: 0,
      maxHealthyPercent: 200,
      circuitBreaker: { enable: true, rollback: false },
      securityGroups: [props.backendSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
    });

    // ── ALB Target Groups & Routing ──

    // Backend target: /api/*
    const backendTargetGroup = listener.addTargets('BackendTarget', {
      targetGroupName: `dc-${props.environment}-be`,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [backendService],
      healthCheck: {
        path: '/api/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
      priority: 10,
    });

    // Frontend target: /* (default)
    const frontendTargetGroup = listener.addTargets('FrontendTarget', {
      targetGroupName: `dc-${props.environment}-fe`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [frontendService],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // ── Outputs ──
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'Internal ALB DNS name — use this in Cloudflare Tunnel ingress config',
    });

    new cdk.CfnOutput(this, 'FrontendEcrUri', {
      value: this.frontendRepository.repositoryUri,
      description: 'Frontend ECR repository URI',
    });

    new cdk.CfnOutput(this, 'BackendEcrUri', {
      value: this.backendRepository.repositoryUri,
      description: 'Backend ECR repository URI',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster name',
    });
  }
}
