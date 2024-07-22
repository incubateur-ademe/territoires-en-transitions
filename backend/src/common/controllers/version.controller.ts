import { Controller, Get } from '@nestjs/common';

@Controller()
export class VersionController {
  //@PublicEndpoint()
  @Get('version')
  async getVersion() {
    return {
      commit: process.env.GIT_COMMIT_SHORT_SHA,
    };
  }
}
