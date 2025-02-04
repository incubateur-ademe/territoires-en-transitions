import { Module } from '@nestjs/common';
import { AuthModule } from '@/backend/auth/auth.module';
import { CollectivitesModule } from '@/backend/collectivites/collectivites.module';
import { ThematiqueService } from '@/backend/shared/thematiques/thematique.service';
import { EffetAttenduService } from '@/backend/shared/effet-attendu/effet-attendu.service';

@Module({
  imports: [],
  providers: [
    ThematiqueService,
    EffetAttenduService,
  ],
  exports: [
    ThematiqueService,
    EffetAttenduService,
  ],
})
export class SharedModule {}
