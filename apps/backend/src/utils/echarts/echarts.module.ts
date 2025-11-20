import { EchartsController } from '@tet/backend/utils/echarts/echarts.controller';
import { EchartsService } from '@tet/backend/utils/echarts/echarts.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [EchartsController],
  providers: [EchartsService],
  exports: [EchartsService],
})
export class EchartsModule {}
