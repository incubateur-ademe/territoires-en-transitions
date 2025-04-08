import { ENV } from '@/api/environmentVariables';
import { AppEnvironment } from '@/domain/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json(
    {
      commit: ENV.git_short_sha,
      commit_time: ENV.git_commit_timestamp,
      version: ENV.application_version,
      environment: ENV.application_env || AppEnvironment.DEV,
      deploy_time: ENV.deployment_timestamp,
    },
    {
      status: 200,
    }
  );
}
