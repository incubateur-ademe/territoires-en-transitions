import { Module } from '@nestjs/common';
import { VersionController } from './controllers/version.controller';
import DatabaseService from './services/database.service';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
  controllers: [VersionController],
})
export class CommonModule {}
