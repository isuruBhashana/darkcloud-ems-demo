import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface TunnelConstructProps {
  environment: string;
  vpc: ec2.IVpc;
  cluster: ecs.Cluster;
  tunnelSecurityGroup: ec2.SecurityGroup;
  alb: elbv2.ApplicationLoadBalancer;
}

/**
 * TunnelConstruct — Cloudflare Tunnel daemon (cloudflared) on ECS Fargate.
 *
 * Architecture mapping:
 *   cloudflared (private subnet) → outbound via NAT GW → Cloudflare Edge
 *   Cloudflare Tunnel routes requests back through the tunnel → Internal ALB
 *
 * Prerequisites:
 *   Store your Cloudflare Tunnel token in Secrets Manager:
 *   aws secretsmanager create-secret \
 *     --name "darkcloud/<environment>/cloudflare-tunnel-token" \
 *     --secret-string "<TUNNEL_TOKEN>"
 */
export class TunnelConstruct extends Construct {
  constructor(scope: Construct, id: string, props: TunnelConstructProps) {
    super(scope, id);

    // ── Import existing tunnel token secret from Secrets Manager ──
    const tunnelTokenSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'TunnelTokenSecret',
      `darkcloud/${props.environment}/cloudflare-tunnel-token`,
    );

    // ── Task Definition ──
    const taskDef = new ecs.FargateTaskDefinition(this, 'TunnelTaskDef', {
      family: `darkcloud-${props.environment}-tunnel`,
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const logGroup = new logs.LogGroup(this, 'TunnelLogs', {
      logGroupName: `/ecs/darkcloud-${props.environment}/cloudflared`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    taskDef.addContainer('cloudflared', {
      containerName: 'cloudflared',
      image: ecs.ContainerImage.fromRegistry('cloudflare/cloudflared:latest'),
      logging: ecs.LogDriver.awsLogs({
        logGroup: logGroup,
        streamPrefix: 'cloudflared',
      }),
      // The tunnel token contains all config (ingress rules are set in Cloudflare Dashboard)
      secrets: {
        TUNNEL_TOKEN: ecs.Secret.fromSecretsManager(tunnelTokenSecret),
      },
      command: ['tunnel', '--no-autoupdate', 'run'],
      // cloudflared doesn't expose ports — it initiates outbound connections
      essential: true,
    });

    // Grant the task permission to read the secret
    tunnelTokenSecret.grantRead(taskDef.taskRole);

    // ── Fargate Service ──
    const tunnelService = new ecs.FargateService(this, 'TunnelService', {
      serviceName: `darkcloud-${props.environment}-cloudflared`,
      cluster: props.cluster,
      taskDefinition: taskDef,
      desiredCount: 0, // Initial count 0 so infra deploys first; scale to 1 after token setup
      minHealthyPercent: 0,
      maxHealthyPercent: 200,
      circuitBreaker: { enable: true, rollback: false },
      securityGroups: [props.tunnelSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
    });

    // ── Outputs ──
    new cdk.CfnOutput(this, 'TunnelServiceName', {
      value: tunnelService.serviceName,
      description: 'cloudflared ECS service name',
    });

    new cdk.CfnOutput(this, 'TunnelTokenSecretArn', {
      value: tunnelTokenSecret.secretArn,
      description:
        'Secrets Manager ARN for tunnel token — update this with your Cloudflare Tunnel token',
    });
  }
}
