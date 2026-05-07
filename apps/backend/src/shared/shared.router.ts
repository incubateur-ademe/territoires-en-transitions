import { Injectable } from '@nestjs/common';
import { EffetAttenduService } from '@tet/backend/shared/effet-attendu/effet-attendu.service';
import { TempsDeMiseEnOeuvreService } from '@tet/backend/shared/temps-de-mise-en-oeuvre/temps-de-mise-en-oeuvre.service';
import { ThematiqueService } from '@tet/backend/shared/thematiques/thematique.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';

@Injectable()
export class SharedRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly thematiqueService: ThematiqueService,
    private readonly effetAttenduService: EffetAttenduService,
    private readonly tempsDeMiseEnOeuvreService: TempsDeMiseEnOeuvreService
  ) {}

  router = this.trpc.router({
    thematiques: this.trpc.router({
      list: this.trpc.authedProcedure.query(async () => {
        return this.thematiqueService.listThematiques();
      }),
      listSousThematiques: this.trpc.authedProcedure.query(async () => {
        return this.thematiqueService.listSousThematiques();
      }),
    }),
    effetsAttendus: this.trpc.router({
      list: this.trpc.authedProcedure.query(async () => {
        return this.effetAttenduService.getEffetAttendu();
      }),
    }),
    tempsDeMiseEnOeuvre: this.trpc.router({
      list: this.trpc.authedProcedure.query(async () => {
        return this.tempsDeMiseEnOeuvreService.getTempsDeMiseEnOeuvre();
      }),
    }),
  });
}
