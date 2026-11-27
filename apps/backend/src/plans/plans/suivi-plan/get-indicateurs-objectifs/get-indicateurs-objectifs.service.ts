import { Injectable } from '@nestjs/common';
import { IndicateurValeursReadAccessService } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs-read-access.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import {
  PCAET_INDICATEURS_HORS_DEPOT_SUIVI,
  PCAET_INDICATEURS_REGLEMENTAIRES_SUIVI,
} from '@tet/domain/demarches';
import {
  buildDepot,
  IndicateurObjectif,
  IndicateurObjectifSource,
  LigneValeurDepot,
  listObjectifs,
  pickResultats,
  sortIndicateursObjectifs,
} from '@tet/domain/plans';
import { groupBy } from 'es-toolkit';
import { GetPlanError } from '../../get-plan/get-plan.errors';
import { ListSuiviPlanFichesService } from '../list-suivi-plan-fiches.service';
import { withSousAxes } from '../with-sous-axes';
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
    input: GetIndicateursObjectifsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<IndicateurObjectif[], GetPlanError>> {
    // vérifie la lecture du plan et écarte les fiches restreintes invisibles
    const fichesResult = await this.listSuiviPlanFichesService.listFiches(
      input,
      { user, tx }
    );
    if (!fichesResult.success) {
      return fichesResult;
    }
    const { plan, fiches } = fichesResult.data;
    const { collectiviteId } = plan;

    // un filtre de fiche (pilote, service, thématique…) ne tient pas aux axes :
    // les indicateurs liés à un axe sans fiche sortent alors de la liste
    const hasFiltreFiche =
      (input.thematiqueIds?.length ?? 0) > 0 ||
      Object.values(input.filters ?? {}).some(
        (value) =>
          value !== undefined && (!Array.isArray(value) || value.length)
      );
    const hasFiltre = hasFiltreFiche || (input.axeIds?.length ?? 0) > 0;
    // seuls les axes de ce plan comptent : un identifiant d'un autre plan est ignoré
    const axeIdsDuPlan = new Set([plan.id, ...plan.axes.map((axe) => axe.id)]);
    const axeIdsScope = input.axeIds?.length
      ? withSousAxes(
          plan,
          input.axeIds.filter((id) => axeIdsDuPlan.has(id))
        )
      : [...axeIdsDuPlan];
    const axeIndicateurIdsResult = hasFiltreFiche
      ? success([])
      : await this.repository.listAxeIndicateurIds(axeIdsScope, tx);
    if (!axeIndicateurIdsResult.success) {
      return axeIndicateurIdsResult;
    }
    const planIndicateurIds = new Set([
      ...fiches.flatMap((fiche) =>
        (fiche.indicateurs ?? []).map((indicateur) => indicateur.id)
      ),
      ...axeIndicateurIdsResult.data,
    ]);

    const ordrePlanResult = await this.repository.listOrdrePlan(plan.id, tx);
    if (!ordrePlanResult.success) {
      return ordrePlanResult;
    }

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

    // un plan rattaché au dépôt suit aussi les réglementaires hors dépôt
    // (ex. cae_3.b), qui n'ont pas d'objectif de dépôt à faire valoir
    const horsDepotIdsResult =
      depot && canReadValeurs
        ? await this.repository.listIndicateurIdsByIdentifiants(
            PCAET_INDICATEURS_HORS_DEPOT_SUIVI,
            tx
          )
        : success([]);
    if (!horsDepotIdsResult.success) {
      return horsDepotIdsResult;
    }
    const horsDepotIds = new Set(horsDepotIdsResult.data);

    const indicateurIds = [
      ...new Set([
        ...depotParIndicateur.keys(),
        ...horsDepotIds,
        ...planIndicateurIds,
      ]),
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
      sortIndicateursObjectifs(
        // avec un filtre, seuls restent les indicateurs liés aux fiches ou aux axes
        definitionsResult.data
          .filter(({ id }) => !hasFiltre || planIndicateurIds.has(id))
          .map(({ confidentiel, ...definition }): IndicateurObjectif => {
            const valeurs = valeursParIndicateur[definition.id] ?? [];
            const depotIndicateur = depotParIndicateur.get(definition.id);
            const sources: IndicateurObjectifSource[] = [
              ...(depotIndicateur || horsDepotIds.has(definition.id)
                ? (['reglementaire'] as const)
                : []),
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
          }),
        ordrePlanResult.data
      )
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
