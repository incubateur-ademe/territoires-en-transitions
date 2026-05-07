import { Module } from '@nestjs/common';
import { EffetAttenduService } from '@tet/backend/shared/effet-attendu/effet-attendu.service';
import { SharedRouter } from '@tet/backend/shared/shared.router';
import { TempsDeMiseEnOeuvreService } from '@tet/backend/shared/temps-de-mise-en-oeuvre/temps-de-mise-en-oeuvre.service';
import { ThematiqueService } from '@tet/backend/shared/thematiques/thematique.service';

@Module({
  imports: [],
  providers: [
    ThematiqueService,
    EffetAttenduService,
    TempsDeMiseEnOeuvreService,
    SharedRouter,
  ],
  exports: [SharedRouter],
})
export class SharedModule {}
