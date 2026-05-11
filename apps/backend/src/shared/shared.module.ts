import { DepartementService } from '@tet/backend/shared/departements/departement.service';
import { Module } from '@nestjs/common';
import { EffetAttenduService } from '@tet/backend/shared/effet-attendu/effet-attendu.service';
import { RegionService } from '@tet/backend/shared/regions/region.service';
import { SharedRouter } from '@tet/backend/shared/shared.router';
import { TempsDeMiseEnOeuvreService } from '@tet/backend/shared/temps-de-mise-en-oeuvre/temps-de-mise-en-oeuvre.service';
import { ThematiqueService } from '@tet/backend/shared/thematiques/thematique.service';

@Module({
  imports: [],
  providers: [
    ThematiqueService,
    RegionService,
    DepartementService,
    EffetAttenduService,
    TempsDeMiseEnOeuvreService,
    SharedRouter,
  ],
  exports: [SharedRouter],
})
export class SharedModule {}
