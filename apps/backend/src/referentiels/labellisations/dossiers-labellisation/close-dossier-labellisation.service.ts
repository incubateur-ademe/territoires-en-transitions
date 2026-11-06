import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  canDecideDossierLabellisation,
  Etoile,
  SnapshotJalonEnum,
} from '@tet/domain/referentiels';
import { round } from 'es-toolkit';
import { and, eq } from 'drizzle-orm';
import { snapshotTable } from '../../snapshots/snapshot.table';
import { auditTable } from '../audit.table';
import { labellisationDemandeTable } from '../labellisation-demande.table';
import { labellisationTable } from '../labellisation.table';
import { checkLabellisationsAdmin } from './check-labellisations-admin.utils';
import {
  DossiersLabellisationError,
  DossiersLabellisationErrorEnum,
} from './dossiers-labellisation.errors';
import { CloseDossierLabellisationInput } from './dossiers-labellisation.input';

/**
 * Acte la décision sur un dossier et le clôt.
 *
 * Remplace le trigger `labellisation.update_labellisation` : la labellisation
 * est créée explicitement, avec l'étoile et la date décidées en CRA (et non
 * plus l'étoile du snapshot), et une erreur remonte si elle ne peut pas l'être.
 */
@Injectable()
export class CloseDossierLabellisationService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager
  ) {}

  async closeDossier(
    input: CloseDossierLabellisationInput,
    { user }: ServiceSecondArg
  ): Promise<Result<void, DossiersLabellisationError>> {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

    return this.transactionManager.executeSingle(async (tx) => {
      // Audit verrouillé puis lu dans la transaction : deux décisions
      // simultanées sur le même audit ne passent pas toutes les deux la garde.
      // Verrou à part : avec la jointure, Drizzle qualifie `FOR UPDATE OF` du
      // schéma, ce que Postgres refuse.
      await tx
        .select({ id: auditTable.id })
        .from(auditTable)
        .where(eq(auditTable.id, input.auditId))
        .for('update');
      const [dossier] = await tx
        .select({
          audit: {
            id: auditTable.id,
            collectiviteId: auditTable.collectiviteId,
            referentielId: auditTable.referentielId,
            clos: auditTable.clos,
            valide: auditTable.valide,
            dateDebut: auditTable.dateDebut,
          },
          demande: {
            sujet: labellisationDemandeTable.sujet,
            etoiles: labellisationDemandeTable.etoiles,
            associatedCollectiviteId:
              labellisationDemandeTable.associatedCollectiviteId,
          },
        })
        .from(auditTable)
        .leftJoin(
          labellisationDemandeTable,
          and(
            eq(labellisationDemandeTable.id, auditTable.demandeId),
            eq(labellisationDemandeTable.enCours, false)
          )
        )
        .where(eq(auditTable.id, input.auditId));
      if (!dossier) {
        return failure(DossiersLabellisationErrorEnum.DOSSIER_NOT_FOUND);
      }
      if (dossier.audit.clos) {
        return failure(DossiersLabellisationErrorEnum.DOSSIER_CLOS);
      }
      if (!canDecideDossierLabellisation(dossier, input.decision)) {
        return failure(DossiersLabellisationErrorEnum.DECISION_NOT_ALLOWED);
      }

      const { audit, demande } = dossier;
      const collectiviteIds = [
        audit.collectiviteId,
        // Démarche conjointe : la collectivité associée est labellisée aussi
        ...(demande?.associatedCollectiviteId
          ? [demande.associatedCollectiviteId]
          : []),
      ];

      switch (input.decision) {
        case 'labelliser': {
          const scores = await this.getPostAuditScores(audit.id, tx);
          const inserted = await this.insertLabellisations(
            {
              collectiviteIds,
              referentielId: audit.referentielId,
              auditId: audit.id,
              etoiles: input.etoiles as Etoile,
              obtenueLe: input.dateCra,
              ...scores,
            },
            tx
          );
          if (!inserted.success) {
            return inserted;
          }
          await this.closeAudit(
            audit.id,
            { dateCnl: input.dateCra, valideLabellisation: true },
            tx
          );
          return success(undefined);
        }

        case 'valider_premiere_etoile': {
          // Pas d'audit pour la 1ère étoile, donc pas de score
          const inserted = await this.insertLabellisations(
            {
              collectiviteIds,
              referentielId: audit.referentielId,
              auditId: audit.id,
              etoiles: 1,
              obtenueLe: input.date,
              scoreRealise: null,
              scoreProgramme: null,
            },
            tx
          );
          if (!inserted.success) {
            return inserted;
          }
          await this.closeAudit(
            audit.id,
            { dateCnl: input.date, valideLabellisation: true },
            tx
          );
          return success(undefined);
        }

        case 'clore': {
          // Un audit COT seul n'a pas de décision de labellisation
          const isLabellisation = demande?.sujet && demande.sujet !== 'cot';
          await this.closeAudit(
            audit.id,
            isLabellisation ? { valideLabellisation: false } : {},
            tx
          );
          return success(undefined);
        }
      }
    });
  }

  private async getPostAuditScores(auditId: number, tx: Transaction) {
    const [snapshot] = await tx
      .select({
        pointFait: snapshotTable.pointFait,
        pointProgramme: snapshotTable.pointProgramme,
        pointPotentiel: snapshotTable.pointPotentiel,
      })
      .from(snapshotTable)
      .where(
        and(
          eq(snapshotTable.auditId, auditId),
          eq(snapshotTable.jalon, SnapshotJalonEnum.POST_AUDIT)
        )
      );

    if (!snapshot?.pointPotentiel) {
      return { scoreRealise: null, scoreProgramme: null };
    }
    return {
      scoreRealise: round(
        (snapshot.pointFait / snapshot.pointPotentiel) * 100,
        1
      ),
      scoreProgramme: round(
        (snapshot.pointProgramme / snapshot.pointPotentiel) * 100,
        1
      ),
    };
  }

  private async insertLabellisations(
    {
      collectiviteIds,
      referentielId,
      auditId,
      etoiles,
      obtenueLe,
      scoreRealise,
      scoreProgramme,
    }: {
      collectiviteIds: number[];
      referentielId: typeof auditTable.$inferSelect.referentielId;
      auditId: number;
      etoiles: Etoile;
      obtenueLe: string;
      scoreRealise: number | null;
      scoreProgramme: number | null;
    },
    tx: Transaction
  ): Promise<Result<void, DossiersLabellisationError>> {
    const inserted = await tx
      .insert(labellisationTable)
      .values(
        collectiviteIds.map((collectiviteId) => ({
          collectiviteId,
          referentiel: referentielId,
          auditId,
          etoiles,
          obtenueLe,
          scoreRealise,
          scoreProgramme,
        }))
      )
      // Une seule labellisation par collectivité, référentiel et année
      .onConflictDoNothing()
      .returning({ id: labellisationTable.id });

    if (inserted.length !== collectiviteIds.length) {
      return failure(
        DossiersLabellisationErrorEnum.LABELLISATION_ALREADY_EXISTS
      );
    }
    return success(undefined);
  }

  private async closeAudit(
    auditId: number,
    values: { dateCnl?: string; valideLabellisation?: boolean },
    tx: Transaction
  ) {
    await tx
      .update(auditTable)
      .set({ ...values, clos: true })
      .where(eq(auditTable.id, auditId));
  }
}
