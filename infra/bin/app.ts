#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DarkCloudStack } from '../lib/main-stack';

const app = new cdk.App();

// ── Environment configuration ──
// Override via CDK context: cdk deploy -c environment=staging
const environment = app.node.tryGetContext('environment') || 'production';

const envConfig: Record<string, { account?: string; region: string }> = {
  production: {
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  staging: {
    region: process.env.CDK_DEFAULT_REGION || 'ap-southeast-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
};

const config = envConfig[environment] || envConfig.production;

new DarkCloudStack(app, `DarkCloud-${environment}`, {
  env: {
    account: config.account,
    region: config.region,
  },
  environment,
  description: `DarkCloud EMS - ${environment} environment`,
});

app.synth();
