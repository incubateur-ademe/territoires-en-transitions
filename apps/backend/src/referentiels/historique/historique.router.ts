import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  listHistoriqueInputSchema,
  listHistoriqueOutputSchema,
  listHistoriqueUtilisateurInputSchema,
  listHistoriqueUtilisateurOutputSchema,
} from '@tet/domain/referentiels';
import { ListHistoriqueUtilisateurService } from './list-historique-utilisateur/list-historique-utilisateur.service';
import { ListHistoriqueService } from './list-historique/list-historique.service';

@Injectable()
export class HistoriqueRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listHistoriqueService: ListHistoriqueService,
    private readonly listHistoriqueUtilisateurService: ListHistoriqueUtilisateurService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listHistoriqueInputSchema)
      .output(listHistoriqueOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        return this.listHistoriqueService.listHistorique(input, user);
      }),

    listUtilisateurs: this.trpc.authedProcedure
      .input(listHistoriqueUtilisateurInputSchema)
      .output(listHistoriqueUtilisateurOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        return this.listHistoriqueUtilisateurService.listHistoriqueUtilisateur(
          input,
          user
        );
      }),
  });
}
