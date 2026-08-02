import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkConstructProps {
  environment: string;
}

/**
 * NetworkConstruct — VPC, subnets, NAT Gateway, and security groups.
 *
 * Architecture mapping:
 *   Public Subnet  → IGW + NAT Gateway (for cloudflared outbound)
 *   Private Subnet → ECS Fargate, Internal ALB, cloudflared, RDS
 */
export class NetworkConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly frontendSecurityGroup: ec2.SecurityGroup;
  public readonly backendSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly tunnelSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkConstructProps) {
    super(scope, id);

    // ── VPC: 10.0.0.0/16 with 2 AZs ──
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `darkcloud-${props.environment}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1, // Cost-conscious: 1 NAT GW (use 2 for HA in prod)
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ── Security Group: Internal ALB ──
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: this.vpc,
      securityGroupName: `darkcloud-${props.environment}-alb-sg`,
      description: 'Internal ALB - accepts traffic from cloudflared only',
      allowAllOutbound: true,
    });

    // ── Security Group: Frontend ECS ──
    this.frontendSecurityGroup = new ec2.SecurityGroup(this, 'FrontendSg', {
      vpc: this.vpc,
      securityGroupName: `darkcloud-${props.environment}-frontend-sg`,
      description: 'Frontend Fargate tasks',
      allowAllOutbound: true,
    });

    // ── Security Group: Backend ECS ──
    this.backendSecurityGroup = new ec2.SecurityGroup(this, 'BackendSg', {
      vpc: this.vpc,
      securityGroupName: `darkcloud-${props.environment}-backend-sg`,
      description: 'Backend Fargate tasks',
      allowAllOutbound: true,
    });

    // ── Security Group: RDS ──
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSg', {
      vpc: this.vpc,
      securityGroupName: `darkcloud-${props.environment}-db-sg`,
      description: 'RDS PostgreSQL - accepts traffic from backend only',
      allowAllOutbound: false,
    });

    // ── Security Group: cloudflared tunnel ──
    this.tunnelSecurityGroup = new ec2.SecurityGroup(this, 'TunnelSg', {
      vpc: this.vpc,
      securityGroupName: `darkcloud-${props.environment}-tunnel-sg`,
      description: 'cloudflared tunnel daemon - egress only',
      allowAllOutbound: true, // Outbound to Cloudflare via NAT GW
    });

    // ── Ingress Rules ──

    // ALB accepts from cloudflared on port 80
    this.albSecurityGroup.addIngressRule(
      this.tunnelSecurityGroup,
      ec2.Port.tcp(80),
      'Allow cloudflared to reach Internal ALB',
    );

    // Frontend accepts from ALB on port 80
    this.frontendSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow ALB to reach frontend',
    );

    // Backend accepts from ALB on port 3000
    this.backendSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow ALB to reach backend',
    );

    // RDS accepts from backend on port 5432
    this.databaseSecurityGroup.addIngressRule(
      this.backendSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow backend to reach RDS',
    );

    // ── Outputs ──
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });
  }
}
