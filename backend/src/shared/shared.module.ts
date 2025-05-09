import { EffetAttenduService } from '@/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@/backend/shared/thematiques/thematique.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [ThematiqueService, EffetAttenduService],
  exports: [ThematiqueService, EffetAttenduService],
})
export class SharedModule {}
