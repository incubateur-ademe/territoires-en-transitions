import { Injectable } from '@nestjs/common';
import { IndicateurValeursReadAccessService } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs-read-access.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { PCAET_INDICATEURS_REGLEMENTAIRES_SUIVI } from '@tet/domain/demarches';
import {
  buildDepot,
  compareIndicateursObjectifs,
  IndicateurObjectif,
  IndicateurObjectifSource,
  LigneValeurDepot,
  listObjectifs,
  pickResultats,
} from '@tet/domain/plans';
import { groupBy } from 'es-toolkit';
import { GetPlanError } from '../../get-plan/get-plan.errors';
import { ListSuiviPlanFichesService } from '../list-suivi-plan-fiches.service';
import { GetIndicateursObjectifsInput } from './get-indicateurs-objectifs.input';
import {
  DepotDuPlan,
  GetIndicateursObjectifsRepository,
} from './get-indicateurs-objectifs.repository';

@Injectable()
export class GetIndicateursObjectifsService {
  constructor(
    private readonly listSuiviPlanFichesService: ListSuiviPlanFichesService,
    private readonly repository: GetIndicateursObjectifsRepository,
    private readonly readAccessService: IndicateurValeursReadAccessService
  ) {}

  async getIndicateursObjectifs(
    { planId }: GetIndicateursObjectifsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<IndicateurObjectif[], GetPlanError>> {
    // vérifie la lecture du plan et écarte les fiches restreintes invisibles
    const fichesResult = await this.listSuiviPlanFichesService.listFiches(
      { planId },
      { user, tx }
    );
    if (!fichesResult.success) {
      return fichesResult;
    }
    const { plan, fiches } = fichesResult.data;
    const { collectiviteId } = plan;

    const axeIndicateurIdsResult = await this.repository.listAxeIndicateurIds(
      [plan.id, ...plan.axes.map((axe) => axe.id)],
      tx
    );
    if (!axeIndicateurIdsResult.success) {
      return axeIndicateurIdsResult;
    }
    const planIndicateurIds = new Set([
      ...fiches.flatMap((fiche) =>
        (fiche.indicateurs ?? []).map((indicateur) => indicateur.id)
      ),
      ...axeIndicateurIdsResult.data,
    ]);

    const reader = await this.readAccessService.resolveReader({
      collectiviteId,
      user,
      tx,
    });
    const canReadValeurs = reader.success;
    const canReadConfidentiel = reader.success && reader.data === 'member';

    const depotResult = canReadValeurs
      ? await this.repository.findDepotDuPlan(plan.id, collectiviteId, tx)
      : success(null);
    if (!depotResult.success) {
      return depotResult;
    }
    // un visiteur ne voit le dépôt qu'une fois publié
    const depot =
      depotResult.data && (canReadConfidentiel || depotResult.data.isPublie)
        ? depotResult.data
        : null;
    const valeursDepotResult = await this.listValeursDepot(
      depot,
      collectiviteId,
      tx
    );
    if (!valeursDepotResult.success) {
      return valeursDepotResult;
    }
    const anneeCourante = new Date().getFullYear();
    const depotParIndicateur = new Map(
      Object.entries(
        groupBy(valeursDepotResult.data, (valeur) => valeur.indicateurId)
      )
        .map(
          ([id, lignes]) =>
            [Number(id), buildDepot(lignes, anneeCourante)] as const
        )
        // un réglementaire n'entre dans la liste qu'avec un objectif saisi
        .filter(([, depotIndicateur]) => depotIndicateur.objectifs.length)
    );

    const indicateurIds = [
      ...new Set([...depotParIndicateur.keys(), ...planIndicateurIds]),
    ];
    const definitionsResult = await this.repository.listDefinitions(
      indicateurIds,
      collectiviteId,
      tx
    );
    if (!definitionsResult.success) {
      return definitionsResult;
    }

    const valeursResult = canReadValeurs
      ? await this.repository.listValeurs(indicateurIds, collectiviteId, tx)
      : success([]);
    if (!valeursResult.success) {
      return valeursResult;
    }
    const valeursParIndicateur = groupBy(
      valeursResult.data,
      (valeur) => valeur.indicateurId
    );

    return success(
      definitionsResult.data
        .map(({ confidentiel, ...definition }): IndicateurObjectif => {
          const valeurs = valeursParIndicateur[definition.id] ?? [];
          const depotIndicateur = depotParIndicateur.get(definition.id);
          const sources: IndicateurObjectifSource[] = [
            ...(depotIndicateur ? (['reglementaire'] as const) : []),
            ...(planIndicateurIds.has(definition.id)
              ? (['plan'] as const)
              : []),
          ];
          return {
            ...definition,
            resultats: pickResultats(valeurs, definition.periodicite, {
              maskDernierResultatCollectivite:
                confidentiel && !canReadConfidentiel,
            }),
            // les objectifs du dépôt priment sur ceux saisis hors dépôt
            objectifs: depotIndicateur?.objectifs ?? listObjectifs(valeurs),
            sources,
            departDepot: depotIndicateur?.departDepot ?? null,
          };
        })
        .sort(compareIndicateursObjectifs)
    );
  }

  private async listValeursDepot(
    depot: DepotDuPlan | null,
    collectiviteId: number,
    tx: ServiceSecondArg['tx']
  ): Promise<
    Result<Array<LigneValeurDepot & { indicateurId: number }>, GetPlanError>
  > {
    if (!depot) {
      return success([]);
    }
    const idsResult = await this.repository.listIndicateurIdsByIdentifiants(
      PCAET_INDICATEURS_REGLEMENTAIRES_SUIVI,
      tx
    );
    if (!idsResult.success) {
      return idsResult;
    }
    return this.repository.listValeursDepot(
      idsResult.data,
      collectiviteId,
      depot.metadonneeId,
      tx
    );
  }
}
