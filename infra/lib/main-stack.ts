import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseConstruct } from './database-stack';
import { EcsConstruct } from './ecs-stack';
import { NetworkConstruct } from './network-stack';
import { TunnelConstruct } from './tunnel-stack';

export interface DarkCloudStackProps extends cdk.StackProps {
  environment: string;
}

/**
 * DarkCloudStack — Orchestrator stack composing all infrastructure constructs.
 *
 * Deployment order (handled automatically by CDK):
 *   1. Network (VPC, subnets, NAT GW, security groups)
 *   2. Database (RDS PostgreSQL)
 *   3. ECS (Cluster, Internal ALB, Frontend/Backend services, ECR)
 *   4. Tunnel (cloudflared Fargate service)
 */
export class DarkCloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DarkCloudStackProps) {
    super(scope, id, props);

    // ── 1. Network ──
    const network = new NetworkConstruct(this, 'Network', {
      environment: props.environment,
    });

    // ── 2. Database ──
    const database = new DatabaseConstruct(this, 'Database', {
      environment: props.environment,
      vpc: network.vpc,
      securityGroup: network.databaseSecurityGroup,
    });

    // ── 3. ECS (Frontend + Backend + Internal ALB) ──
    const ecs = new EcsConstruct(this, 'Ecs', {
      environment: props.environment,
      vpc: network.vpc,
      frontendSecurityGroup: network.frontendSecurityGroup,
      backendSecurityGroup: network.backendSecurityGroup,
      albSecurityGroup: network.albSecurityGroup,
      dbInstance: database.instance,
      dbCredentials: database.credentials,
    });

    // ── 4. Cloudflare Tunnel (cloudflared) ──
    const tunnel = new TunnelConstruct(this, 'Tunnel', {
      environment: props.environment,
      vpc: network.vpc,
      cluster: ecs.cluster,
      tunnelSecurityGroup: network.tunnelSecurityGroup,
      alb: ecs.alb,
    });

    // ── Stack Tags ──
    cdk.Tags.of(this).add('Project', 'DarkCloud-EMS');
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
