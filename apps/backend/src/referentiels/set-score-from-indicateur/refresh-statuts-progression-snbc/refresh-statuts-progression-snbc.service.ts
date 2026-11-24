import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { getAnnee } from '@tet/backend/indicateurs/valeurs/progression.rules';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { actionScoreIndicateurValeurTable } from '@tet/backend/referentiels/models/action-score-indicateur-valeur.table';
import { ServiceRoleUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { and, eq, ilike, inArray } from 'drizzle-orm';
import { SetScoreFromIndicateurError } from '../set-score-from-indicateur.errors';
import { SetScoreFromIndicateurService } from '../set-score-from-indicateur.service';

export type RefreshStatutsProgressionSnbcResult = {
  collectiviteIds: number[];
  /** sélections antérieures à l'année de départ de la trajectoire */
  selectionsSupprimees: number;
};

/**
 * Rattrapage ponctuel de la bascule du score indicatif sur la SNBC 3 (source
 * `snbc3`, départ 2021), pour les actions TE notées par `progression_snbc(...)` :
 * 1. supprime les valeurs sélectionnées antérieures à l'année de départ, qui
 *    ne mesurent plus aucune progression ;
 * 2. recalcule le statut dérivé du score indicatif de ces actions, puis le
 *    score courant TE, pour chaque collectivité qui avait une sélection.
 *
 * À retirer une fois exécuté en production.
 */
@Injectable()
export class RefreshStatutsProgressionSnbcService {
  private readonly logger = new Logger(
    RefreshStatutsProgressionSnbcService.name
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly indicateurExpressionService: IndicateurExpressionService,
    private readonly setScoreFromIndicateurService: SetScoreFromIndicateurService
  ) {}

  async refresh(
    {
      collectiviteIds,
      modifiedBy,
    }: { collectiviteIds?: number[]; modifiedBy: string },
    { user }: { user: ServiceRoleUser }
  ): Promise<
    Result<RefreshStatutsProgressionSnbcResult, SetScoreFromIndicateurError>
  > {
    try {
      const selections = await this.databaseService.db
        .select({
          collectiviteId: actionScoreIndicateurValeurTable.collectiviteId,
          actionId: actionScoreIndicateurValeurTable.actionId,
          indicateurValeurId:
            actionScoreIndicateurValeurTable.indicateurValeurId,
          typeScore: actionScoreIndicateurValeurTable.typeScore,
          dateValeur: indicateurValeurTable.dateValeur,
          identifiant: indicateurDefinitionTable.identifiantReferentiel,
          exprScore: actionDefinitionTable.exprScore,
        })
        .from(actionScoreIndicateurValeurTable)
        .innerJoin(
          actionDefinitionTable,
          eq(
            actionDefinitionTable.actionId,
            actionScoreIndicateurValeurTable.actionId
          )
        )
        .innerJoin(
          indicateurValeurTable,
          eq(
            indicateurValeurTable.id,
            actionScoreIndicateurValeurTable.indicateurValeurId
          )
        )
        .innerJoin(
          indicateurDefinitionTable,
          eq(
            indicateurDefinitionTable.id,
            actionScoreIndicateurValeurTable.indicateurId
          )
        )
        .where(
          and(
            eq(actionDefinitionTable.referentielId, ReferentielIdEnum.TE),
            ilike(actionDefinitionTable.exprScore, '%progression_snbc%'),
            collectiviteIds
              ? inArray(
                  actionScoreIndicateurValeurTable.collectiviteId,
                  collectiviteIds
                )
              : undefined
          )
        );

      const invalides = selections.filter((selection) => {
        const anneeDepart = this.getAnneeDepart(
          selection.exprScore,
          selection.identifiant
        );
        return (
          anneeDepart !== null && getAnnee(selection.dateValeur) < anneeDepart
        );
      });

      for (const selection of invalides) {
        await this.databaseService.db
          .delete(actionScoreIndicateurValeurTable)
          .where(
            and(
              eq(
                actionScoreIndicateurValeurTable.collectiviteId,
                selection.collectiviteId
              ),
              eq(actionScoreIndicateurValeurTable.actionId, selection.actionId),
              eq(
                actionScoreIndicateurValeurTable.indicateurValeurId,
                selection.indicateurValeurId
              ),
              eq(
                actionScoreIndicateurValeurTable.typeScore,
                selection.typeScore
              )
            )
          );
      }

      // une entrée par action, que sa sélection ait été supprimée ou non
      const actions = [
        ...new Map(
          selections.map(({ collectiviteId, actionId }) => [
            `${collectiviteId}:${actionId}`,
            { collectiviteId, actionId },
          ])
        ).values(),
      ];
      await this.setScoreFromIndicateurService.refreshActionsAvancementAndSnapshots(
        actions,
        user,
        { modifiedBy }
      );

      return success({
        collectiviteIds: [...new Set(actions.map((a) => a.collectiviteId))],
        selectionsSupprimees: invalides.length,
      });
    } catch (error) {
      this.logger.error(error);
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /** Année de départ de `progression_snbc(identifiant[, année])` dans la formule */
  private getAnneeDepart(
    exprScore: string | null,
    identifiant: string | null
  ): number | null {
    if (!exprScore || !identifiant) {
      return null;
    }
    const references =
      this.indicateurExpressionService.extractNeededSourceIndicateursFromFormula(
        exprScore
      );
    if (!references.success) {
      return null;
    }
    const reference = references.data.find(
      (ref) => ref.identifiant.toLowerCase() === identifiant.toLowerCase()
    );
    const progression = reference?.progressions?.find(
      (p) => p.token === 'progression_snbc'
    );
    return progression?.anneeDepart ?? null;
  }
}
