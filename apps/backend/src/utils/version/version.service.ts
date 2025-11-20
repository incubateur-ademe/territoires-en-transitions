import { Injectable } from '@nestjs/common';
import { AppEnvironment, VersionResponseType } from '@tet/domain/utils';

@Injectable()
export default class VersionService {
  getVersion(): VersionResponseType {
    return {
      commit: process.env.GIT_COMMIT_SHORT_SHA,
      version: process.env.APPLICATION_VERSION,
      environment: process.env.ENV_NAME as AppEnvironment,
      deploy_time: process.env.DEPLOYMENT_TIMESTAMP,
      commit_time: process.env.GIT_COMMIT_TIMESTAMP,
    };
  }
}
