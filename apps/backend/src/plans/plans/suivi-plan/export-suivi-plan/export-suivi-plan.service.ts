import { Injectable } from '@nestjs/common';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import { unaccent } from '@tet/backend/utils/unaccent.utils';
import { format } from 'date-fns';
import {
  EN_COURS_SANS_AVANCEMENT_LABEL,
  NON_MODIFIEE_DEPUIS_PLUS_D_UN_AN_LABEL,
  SANS_PILOTE_LABEL,
  SANS_PRIORITE_LABEL,
  SANS_REFERENT_LABEL,
  SANS_STATUT_LABEL,
} from '@tet/domain/plans';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { GetPlanError } from '../../get-plan/get-plan.errors';
import { GetPlanService } from '../../get-plan/get-plan.service';
import { GetAvancementParAxeService } from '../get-avancement-par-axe/get-avancement-par-axe.service';
import { GetEvolutionStatutsInput } from '../get-evolution-statuts/get-evolution-statuts.input';
import { GetEvolutionStatutsService } from '../get-evolution-statuts/get-evolution-statuts.service';
import { GetVueEnsembleService } from '../get-vue-ensemble/get-vue-ensemble.service';
import { SuiviPlanBlocInput, SuiviPlanFilters } from '../suivi-plan.input';
import {
  buildAvancementParAxeXlsx,
  buildEvolutionStatutsXlsx,
  buildVueEnsembleXlsx,
  SuiviPlanExportEntete,
} from './export-suivi-plan.xlsx';

export type SuiviPlanExport = { buffer: Buffer; filename: string };

@Injectable()
export class ExportSuiviPlanService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly getPlanService: GetPlanService,
    private readonly getVueEnsembleService: GetVueEnsembleService,
    private readonly getAvancementParAxeService: GetAvancementParAxeService,
    private readonly getEvolutionStatutsService: GetEvolutionStatutsService
  ) {}

  async exportVueEnsemble(
    input: SuiviPlanBlocInput,
    context: ServiceSecondArg
  ): Promise<Result<SuiviPlanExport, GetPlanError>> {
    const result = await this.getVueEnsembleService.getVueEnsemble(
      input,
      context
    );
    if (!result.success) {
      return result;
    }
    return this.export(input, "Vue d'ensemble", context, (entete) =>
      buildVueEnsembleXlsx(entete, result.data)
    );
  }

  async exportAvancementParAxe(
    input: SuiviPlanBlocInput,
    context: ServiceSecondArg
  ): Promise<Result<SuiviPlanExport, GetPlanError>> {
    const result = await this.getAvancementParAxeService.getAvancementParAxe(
      input,
      context
    );
    if (!result.success) {
      return result;
    }
    return this.export(input, 'Avancement par axe', context, (entete) =>
      buildAvancementParAxeXlsx(entete, result.data)
    );
  }

  async exportEvolutionStatuts(
    input: GetEvolutionStatutsInput,
    context: ServiceSecondArg
  ): Promise<Result<SuiviPlanExport, GetPlanError>> {
    const result = await this.getEvolutionStatutsService.getEvolutionStatuts(
      input,
      context
    );
    if (!result.success) {
      return result;
    }
    return this.export(input, 'Évolution des statuts', context, (entete) =>
      buildEvolutionStatutsXlsx(
        entete,
        result.data,
        input.inclureActionsContinues
      )
    );
  }

  private async export(
    { planId, thematiqueIds, filters = {} }: SuiviPlanBlocInput,
    titre: string,
    context: ServiceSecondArg,
    build: (entete: SuiviPlanExportEntete) => Promise<ArrayBuffer>
  ): Promise<Result<SuiviPlanExport, GetPlanError>> {
    const planResult = await this.getPlanService.getPlan({ planId }, context);
    if (!planResult.success) {
      return planResult;
    }
    const planNom = planResult.data.nom || 'Sans titre';

    const thematiques = thematiqueIds?.length
      ? await this.databaseService.db
          .select({ nom: thematiqueTable.nom })
          .from(thematiqueTable)
          .where(inArray(thematiqueTable.id, thematiqueIds))
          .orderBy(asc(thematiqueTable.nom))
      : [];

    const now = new Date();
    const buffer = await build({
      titre,
      planNom,
      thematiques: thematiques.map(({ nom }) => nom),
      filtres: await this.getFiltres(filters, planResult.data.collectiviteId),
      exporteLe: format(now, 'dd/MM/yyyy'),
    });

    return success({
      buffer: Buffer.from(buffer),
      filename: unaccent(
        `Suivi_${planNom}_${titre}_${format(now, 'yyyy-MM-dd')}.xlsx`
      ),
    });
  }

  private async getFiltres(
    filters: SuiviPlanFilters,
    collectiviteId: number
  ): Promise<[string, string][]> {
    const listPersonnes = async (
      personneIds: number[] = [],
      utilisateurIds: string[] = []
    ) => [
      ...(personneIds.length
        ? await this.databaseService.db
            .select({ nom: personneTagTable.nom })
            .from(personneTagTable)
            .where(
              and(
                inArray(personneTagTable.id, personneIds),
                eq(personneTagTable.collectiviteId, collectiviteId)
              )
            )
        : []
      ).map(({ nom }) => nom),
      ...(utilisateurIds.length
        ? await this.databaseService.db
            .select({ prenom: dcpTable.prenom, nom: dcpTable.nom })
            .from(dcpTable)
            .innerJoin(
              utilisateurCollectiviteAccessTable,
              eq(utilisateurCollectiviteAccessTable.userId, dcpTable.id)
            )
            .where(
              and(
                inArray(dcpTable.id, utilisateurIds),
                eq(
                  utilisateurCollectiviteAccessTable.collectiviteId,
                  collectiviteId
                )
              )
            )
        : []
      ).map(({ prenom, nom }) => `${prenom} ${nom}`),
    ];

    const filtres: [string, string[]][] = [
      [
        'Personne pilote',
        [
          ...(await listPersonnes(
            filters.personnePiloteIds,
            filters.utilisateurPiloteIds
          )),
          ...(filters.noPilote ? [SANS_PILOTE_LABEL] : []),
        ],
      ],
      [
        'Statut',
        [
          ...(filters.statuts ?? []),
          ...(filters.noStatut ? [SANS_STATUT_LABEL] : []),
        ],
      ],
      [
        'Élu·e référent·e',
        [
          ...(await listPersonnes(
            filters.personneReferenteIds,
            filters.utilisateurReferentIds
          )),
          ...(filters.noReferent ? [SANS_REFERENT_LABEL] : []),
        ],
      ],
      [
        'Priorité',
        [
          ...(filters.priorites ?? []),
          ...(filters.noPriorite ? [SANS_PRIORITE_LABEL] : []),
        ],
      ],
      [
        'Suivi',
        [
          ...(filters.enCoursSansAvancement
            ? [EN_COURS_SANS_AVANCEMENT_LABEL]
            : []),
          ...(filters.notModifiedForOverAYear
            ? [NON_MODIFIEE_DEPUIS_PLUS_D_UN_AN_LABEL]
            : []),
        ],
      ],
    ];

    return filtres
      .filter(([, valeurs]) => valeurs.length > 0)
      .map(([libelle, valeurs]) => [libelle, valeurs.join(', ')]);
  }
}
