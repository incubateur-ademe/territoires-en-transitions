import { Injectable, Logger } from '@nestjs/common';
import { actionCommentaireTable } from '@tet/backend/referentiels/models/action-commentaire.table';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { actionStatutTable } from '@tet/backend/referentiels/models/action-statut.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import type {
  CollectiviteReferentielPreferenceId,
  NiveauRemplissage,
} from '@tet/domain/collectivites';
import { and, count, eq, inArray, max, sql } from 'drizzle-orm';
import { shouldDisplayReferentielByCriteria } from './compute-referentiel-display.rules';

const CAE_ECI_REFERENTIELS = [
  'cae',
  'eci',
] as const satisfies readonly CollectiviteReferentielPreferenceId[];

type CaeEciReferentiel = (typeof CAE_ECI_REFERENTIELS)[number];

export type ReferentielNiveauRemplissageMap = Record<
  CaeEciReferentiel,
  NiveauRemplissage
>;

/**
 * Détermine, pour les référentiels CAE et ECI, le niveau de remplissage d'une
 * collectivité :
 * - `engage` : l'activité (statuts / commentaires) atteint le seuil de
 *   `shouldDisplayReferentielByCriteria` ;
 * - `superficiel` : au moins un statut ou un commentaire non vide, sans
 *   atteindre ce seuil ;
 * - `vide` : aucun statut ni commentaire renseigné.
 *
 * Ce calcul ne dépend que de l'activité, jamais des préférences : il peut donc
 * être exécuté hors transaction. Il est partagé par le reset des préférences
 * d'affichage et par la bascule vers TE (un référentiel archivé reste listé
 * dans la navigation sauf s'il est `vide`).
 */
@Injectable()
export class ComputeReferentielEngagementService {
  private readonly logger = new Logger(
    ComputeReferentielEngagementService.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

  // pas de `user` requis : ce calcul ne dépend que de l'activité, aucune
  // vérification de permission ni journalisation par utilisateur ici.
  // `tx` reste supporté pour le cas où un appelant
  // voudrait l'exécuter à l'intérieur d'une transaction.
  async computeNiveauxRemplissage(
    collectiviteId: number,
    { tx }: Pick<ServiceSecondArg, 'tx'> = {}
  ): Promise<Result<ReferentielNiveauRemplissageMap, 'DATABASE_ERROR'>> {
    const db = tx ?? this.databaseService.db;

    try {
      const statutRows = await db
        .select({
          referentiel: actionRelationTable.referentiel,
          actionStatutCount: count(),
          maxModifiedAt: max(actionStatutTable.modifiedAt),
        })
        .from(actionStatutTable)
        .innerJoin(
          actionRelationTable,
          eq(actionStatutTable.actionId, actionRelationTable.id)
        )
        .where(
          and(
            eq(actionStatutTable.collectiviteId, collectiviteId),
            inArray(actionRelationTable.referentiel, CAE_ECI_REFERENTIELS)
          )
        )
        .groupBy(actionRelationTable.referentiel);

      const commentaireRows = await db
        .select({
          referentiel: actionRelationTable.referentiel,
          actionCommentaireCount: count(),
          nonEmptyCommentaireCount: sql<number>`count(*) filter (where trim(${actionCommentaireTable.commentaire}) <> '')`,
          maxModifiedAt: max(actionCommentaireTable.modifiedAt),
        })
        .from(actionCommentaireTable)
        .innerJoin(
          actionRelationTable,
          eq(actionCommentaireTable.actionId, actionRelationTable.id)
        )
        .where(
          and(
            eq(actionCommentaireTable.collectiviteId, collectiviteId),
            inArray(actionRelationTable.referentiel, CAE_ECI_REFERENTIELS)
          )
        )
        .groupBy(actionRelationTable.referentiel);

      const statutByReferentiel = Object.fromEntries(
        statutRows.map((r) => [
          r.referentiel,
          {
            actionStatutCount: Number(r.actionStatutCount ?? 0),
            maxModifiedAt: r.maxModifiedAt,
          },
        ])
      );
      const commentaireByReferentiel = Object.fromEntries(
        commentaireRows.map((r) => [
          r.referentiel,
          {
            actionCommentaireCount: Number(r.actionCommentaireCount ?? 0),
            nonEmptyCommentaireCount: Number(r.nonEmptyCommentaireCount ?? 0),
            maxModifiedAt: r.maxModifiedAt,
          },
        ])
      );

      const niveauxRemplissage = {} as ReferentielNiveauRemplissageMap;
      for (const ref of CAE_ECI_REFERENTIELS) {
        const statut = statutByReferentiel[ref];
        const commentaire = commentaireByReferentiel[ref];
        const actionStatutCount = statut?.actionStatutCount ?? 0;
        const isEngaged = shouldDisplayReferentielByCriteria({
          actionStatutCount,
          actionCommentaireCount: commentaire?.actionCommentaireCount ?? 0,
          lastActivityAt: this.mostRecentDate(
            statut?.maxModifiedAt,
            commentaire?.maxModifiedAt
          ),
        });
        const hasData =
          actionStatutCount > 0 ||
          (commentaire?.nonEmptyCommentaireCount ?? 0) > 0;
        niveauxRemplissage[ref] = isEngaged
          ? 'engage'
          : hasData
          ? 'superficiel'
          : 'vide';
      }
      return success(niveauxRemplissage);
    } catch (error) {
      this.logger.error(
        `Calcul du niveau de remplissage CAE/ECI échoué pour collectivite=${collectiviteId}`,
        (error as Error).stack
      );
      return failure('DATABASE_ERROR', error as Error);
    }
  }

  private mostRecentDate(
    ...values: (string | null | undefined)[]
  ): Date | null {
    const dates = values
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .map((v) => new Date(v));
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }
}
