import { EffetAttenduService } from '@tet/backend/shared/effet-attendu/effet-attendu.service';
import { ThematiqueService } from '@tet/backend/shared/thematiques/thematique.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [ThematiqueService, EffetAttenduService],
  exports: [ThematiqueService, EffetAttenduService],
})
export class SharedModule {}
