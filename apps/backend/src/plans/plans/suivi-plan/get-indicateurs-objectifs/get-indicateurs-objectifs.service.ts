import { Injectable } from '@nestjs/common';
import { IndicateurValeursReadAccessService } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs-read-access.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { maskDernierResultat } from '@tet/domain/indicateurs';
import {
  IndicateurObjectif,
  pickDerniereValeur,
  pickObjectif,
} from '@tet/domain/plans';
import { groupBy } from 'es-toolkit';
import { GetPlanError } from '../../get-plan/get-plan.errors';
import { ListSuiviPlanFichesService } from '../list-suivi-plan-fiches.service';
import { GetIndicateursObjectifsInput } from './get-indicateurs-objectifs.input';
import { GetIndicateursObjectifsRepository } from './get-indicateurs-objectifs.repository';

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
    const indicateurIds = [
      ...new Set([
        ...fiches.flatMap((fiche) =>
          (fiche.indicateurs ?? []).map((indicateur) => indicateur.id)
        ),
        ...axeIndicateurIdsResult.data,
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

    const reader = await this.readAccessService.resolveReader({
      collectiviteId,
      user,
      tx,
    });
    const canReadValeurs = reader.success;
    const canReadConfidentiel = reader.success && reader.data === 'member';

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

    const anneeCourante = new Date().getFullYear();

    return success(
      definitionsResult.data
        .map(({ confidentiel, ...definition }) => {
          const valeurs = valeursParIndicateur[definition.id] ?? [];
          const valeursVisibles =
            confidentiel && !canReadConfidentiel
              ? [
                  ...maskDernierResultat(
                    valeurs.filter((v) => v.metadonneeId === null)
                  ),
                  ...valeurs.filter((v) => v.metadonneeId !== null),
                ]
              : valeurs;
          return {
            ...definition,
            derniereValeur: pickDerniereValeur(
              valeursVisibles,
              definition.periodicite
            ),
            objectif: pickObjectif(valeursVisibles, anneeCourante),
          };
        })
        .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'))
    );
  }
}
