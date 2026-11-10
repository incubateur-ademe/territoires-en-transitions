import { Injectable } from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { historiqueFicheActionTable } from '@tet/backend/plans/fiches/shared/models/historique-fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result, success } from '@tet/backend/utils/result.type';
import {
  DEBUT_HISTORIQUE_STATUTS,
  Statut,
  statutEnumValues,
} from '@tet/domain/plans';
import { inArray, sql } from 'drizzle-orm';
import { GetPlanError } from '../../get-plan/get-plan.errors';
import { ListSuiviPlanFichesService } from '../list-suivi-plan-fiches.service';
import { GetEvolutionStatutsInput } from './get-evolution-statuts.input';

export type EvolutionStatuts = {
  dateDebut: string;
  dateFin: string;
  dateDebutRamenee: boolean;
  totalDebut: number;
  totalFin: number;
  creeesDepuisDebut: number;
  actionsContinues: number;
  parStatut: { statut: Statut | null; debut: number; fin: number }[];
};

type StatutALaDate = { existe: boolean; statut: Statut | null };

@Injectable()
export class GetEvolutionStatutsService {
  constructor(
    private readonly listSuiviPlanFichesService: ListSuiviPlanFichesService,
    private readonly databaseService: DatabaseService
  ) {}

  async getEvolutionStatuts(
    {
      dateDebut,
      dateFin,
      inclureActionsContinues,
      ...input
    }: GetEvolutionStatutsInput,
    context: ServiceSecondArg
  ): Promise<Result<EvolutionStatuts, GetPlanError>> {
    const result = await this.listSuiviPlanFichesService.listFiches(
      input,
      context
    );
    if (!result.success) {
      return result;
    }
    const { fiches } = result.data;

    const dateDebutRetenue =
      dateDebut < DEBUT_HISTORIQUE_STATUTS
        ? DEBUT_HISTORIQUE_STATUTS
        : dateDebut;
    const dateFinRetenue =
      dateFin < DEBUT_HISTORIQUE_STATUTS ? DEBUT_HISTORIQUE_STATUTS : dateFin;

    const actionsContinues = fiches.filter(
      (fiche) => fiche.ameliorationContinue
    ).length;
    const ficheIds = fiches
      .filter((fiche) => inclureActionsContinues || !fiche.ameliorationContinue)
      .map((fiche) => fiche.id);

    const photos = await this.getStatutsALaDate(
      ficheIds,
      dateDebutRetenue,
      dateFinRetenue,
      context
    );

    const count = (
      photo: 'debut' | 'fin',
      predicate: (statut: StatutALaDate) => boolean = () => true
    ) =>
      photos.filter((row) => row[photo].existe && predicate(row[photo])).length;

    return success({
      dateDebut: dateDebutRetenue,
      dateFin: dateFinRetenue,
      dateDebutRamenee: dateDebutRetenue !== dateDebut,
      totalDebut: count('debut'),
      totalFin: count('fin'),
      creeesDepuisDebut: photos.filter(
        (row) => !row.debut.existe && row.fin.existe
      ).length,
      actionsContinues,
      parStatut: [...statutEnumValues, null].map((statut) => ({
        statut,
        debut: count('debut', (row) => row.statut === statut),
        fin: count('fin', (row) => row.statut === statut),
      })),
    });
  }

  private async getStatutsALaDate(
    ficheIds: number[],
    dateDebut: string,
    dateFin: string,
    { tx }: ServiceSecondArg
  ): Promise<{ debut: StatutALaDate; fin: StatutALaDate }[]> {
    if (ficheIds.length === 0) {
      return [];
    }

    const statutALaDate = (date: string) => {
      const finDuJour = sql`(${date}::date + 1)::timestamp at time zone 'Europe/Paris'`;
      return sql`json_build_object(
        'existe', f.created_at < ${finDuJour},
        'statut', coalesce(
          (select json_build_object('statut', h.statut)
            from ${historiqueFicheActionTable} h
            where h.fiche_id = f.id and h.modified_at < ${finDuJour}
            order by h.modified_at desc
            limit 1),
          (select json_build_object('statut', h.previous_statut)
            from ${historiqueFicheActionTable} h
            where h.fiche_id = f.id
            order by h.modified_at asc
            limit 1),
          json_build_object('statut', f.statut)
        ) ->> 'statut'
      )`;
    };

    const { rows } = await (tx ?? this.databaseService.db).execute<{
      debut: StatutALaDate;
      fin: StatutALaDate;
    }>(sql`
      select ${statutALaDate(dateDebut)} as debut,
        ${statutALaDate(dateFin)} as fin
      from ${ficheActionTable} f
      where ${inArray(sql`f.id`, ficheIds)}
    `);
    return rows;
  }
}
