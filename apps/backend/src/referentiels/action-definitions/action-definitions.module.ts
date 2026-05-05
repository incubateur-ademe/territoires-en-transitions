import { Module } from '@nestjs/common';
import { ActionDefinitionsRepository } from './action-definitions.repository';

@Module({
  providers: [ActionDefinitionsRepository],
  exports: [ActionDefinitionsRepository],
})
export class ActionDefinitionsModule {}
