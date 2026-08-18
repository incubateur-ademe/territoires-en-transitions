import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import IndicateurExpressionService from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, eq, inArray, isNotNull, notInArray } from 'drizzle-orm';

@Injectable()
export class ReconcileParticipationScoreService {
  private readonly logger = new Logger(
    ReconcileParticipationScoreService.name
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly indicateurExpressionService: IndicateurExpressionService
  ) {}

  /**
   * Aligne `participationScore` sur les indicateurs réellement référencés
   * dans une formule `exprScore` d'action — à appeler après l'import des 3
   * référentiels (CAE/ECI/TE), seul moment où l'ensemble des formules sont
   * connues. Ces références priment sur la colonne `participationScore` du
   * CSV d'indicateurs, qui peut être vraie avant que la formule ne soit
   * finalisée côté référentiel (ou l'inverse). Volontairement indépendant
   * de la colonne `Indicateurs` (liens directs, non liés à un calcul de
   * score) et de la table `indicateur_action` qui mélange les deux sources.
   */
  async reconcile(): Promise<{
    enabledIdentifiants: string[];
    disabledIdentifiants: string[];
  }> {
    const actions = await this.databaseService.db
      .select({ exprScore: actionDefinitionTable.exprScore })
      .from(actionDefinitionTable)
      .where(isNotNull(actionDefinitionTable.exprScore));

    const referencedIdentifiants = new Set<string>();
    for (const { exprScore } of actions) {
      if (!exprScore) {
        continue;
      }
      try {
        this.indicateurExpressionService
          .extractNeededSourceIndicateursFromFormula(exprScore)
          .forEach(({ identifiant }) =>
            referencedIdentifiants.add(identifiant)
          );
      } catch {
        // formule non conforme à la grammaire (ex. encore en cours de
        // rédaction) — ignorée, ne doit pas bloquer la réconciliation
      }
    }

    const linkedIndicateurs = referencedIdentifiants.size
      ? await this.databaseService.db
          .select({ id: indicateurDefinitionTable.id })
          .from(indicateurDefinitionTable)
          .where(
            inArray(
              indicateurDefinitionTable.identifiantReferentiel,
              [...referencedIdentifiants]
            )
          )
      : [];
    const linkedIndicateurIds = linkedIndicateurs.map((row) => row.id);

    const disabled = await this.databaseService.db
      .update(indicateurDefinitionTable)
      .set({ participationScore: false })
      .where(
        and(
          eq(indicateurDefinitionTable.participationScore, true),
          linkedIndicateurIds.length
            ? notInArray(indicateurDefinitionTable.id, linkedIndicateurIds)
            : undefined
        )
      )
      .returning({
        identifiantReferentiel:
          indicateurDefinitionTable.identifiantReferentiel,
      });

    const enabled = linkedIndicateurIds.length
      ? await this.databaseService.db
          .update(indicateurDefinitionTable)
          .set({ participationScore: true })
          .where(
            and(
              eq(indicateurDefinitionTable.participationScore, false),
              inArray(indicateurDefinitionTable.id, linkedIndicateurIds)
            )
          )
          .returning({
            identifiantReferentiel:
              indicateurDefinitionTable.identifiantReferentiel,
          })
      : [];

    const toIdentifiants = (rows: { identifiantReferentiel: string | null }[]) =>
      rows
        .map((row) => row.identifiantReferentiel)
        .filter((identifiant): identifiant is string => identifiant !== null);

    const disabledIdentifiants = toIdentifiants(disabled);
    const enabledIdentifiants = toIdentifiants(enabled);

    if (disabledIdentifiants.length) {
      this.logger.log(
        `participationScore désactivé pour ${
          disabledIdentifiants.length
        } indicateur(s) non référencé(s) par un exprScore : ${disabledIdentifiants.join(
          ', '
        )}`
      );
    }
    if (enabledIdentifiants.length) {
      this.logger.log(
        `participationScore activé pour ${
          enabledIdentifiants.length
        } indicateur(s) désormais référencé(s) par un exprScore : ${enabledIdentifiants.join(
          ', '
        )}`
      );
    }

    return { enabledIdentifiants, disabledIdentifiants };
  }
}
