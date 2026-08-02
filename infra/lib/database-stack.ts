import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  environment: string;
  vpc: ec2.IVpc;
  securityGroup: ec2.SecurityGroup;
}

/**
 * DatabaseConstruct — Amazon RDS PostgreSQL in isolated subnet.
 *
 * Architecture mapping:
 *   Amazon RDS (private subnet) ← Backend Fargate
 */
export class DatabaseConstruct extends Construct {
  public readonly instance: rds.DatabaseInstance;
  public readonly credentials: rds.DatabaseSecret;
  public readonly databaseUrl: string;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // ── Database credentials (auto-generated, stored in Secrets Manager) ──
    this.credentials = new rds.DatabaseSecret(this, 'DbCredentials', {
      secretName: `darkcloud/${props.environment}/db-credentials`,
      username: 'darkcloud_admin',
    });

    // ── RDS PostgreSQL Instance ──
    this.instance = new rds.DatabaseInstance(this, 'PostgresDb', {
      instanceIdentifier: `darkcloud-${props.environment}-db`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.securityGroup],
      credentials: rds.Credentials.fromSecret(this.credentials),
      databaseName: 'darkcloud_ems',
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      multiAz: false, // Set true for production HA
      storageEncrypted: true,
      deletionProtection: false, // Set true for production
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      backupRetention: cdk.Duration.days(1),
      publiclyAccessible: false,
      autoMinorVersionUpgrade: true,
    });

    // ── Outputs ──
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.instance.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL endpoint',
    });

    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.credentials.secretArn,
      description: 'Database credentials secret ARN',
    });
  }
}
