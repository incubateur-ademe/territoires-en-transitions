import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { applyPolicyWhere } from '@tet/backend/authorizations/access-policy';
import { scopeHasPermission, Scope } from '@tet/backend/authorizations/scope';
import { ListMembresService } from '@tet/backend/collectivites/membres/list-membres/list-membres.service';
import { ListPersonneTagsOutput } from '@tet/backend/collectivites/tags/personnes/list-personne-tags.output';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { indicateurPiloteTable } from '@tet/backend/indicateurs/shared/models/indicateur-pilote.table';
import { ficheActionPiloteTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { actionPiloteTable } from '@tet/backend/referentiels/models/action-pilote.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { AnyColumn, and, eq, getTableName, inArray, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { invitationTable } from '../../membres/invitation.table';
import { invitationPersonneTagTable } from '../../membres/mutate-invitations/invitation-personne-tag.table';
import { personneTagPolicy } from './personne-tag.policy';

const tables = [
  ficheActionPiloteTable,
  ficheActionReferentTable,
  indicateurPiloteTable,
  actionPiloteTable,
];

@Injectable()
export class PersonneTagService {
  private readonly logger = new Logger(PersonneTagService.name);
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly listMembresService: ListMembresService
  ) {}

  async listPersonneTags({
    scope,
    collectiviteId,
    tagIds,
  }: {
    scope: Scope;
    collectiviteId: number;
    tagIds: number[];
  }): Promise<ListPersonneTagsOutput[]> {
    const businessWhere =
      tagIds.length > 0
        ? and(
            eq(personneTagTable.collectiviteId, collectiviteId),
            inArray(personneTagTable.id, tagIds)
          )
        : eq(personneTagTable.collectiviteId, collectiviteId);

    return this.databaseService.db
      .select({
        tagId: personneTagTable.id,
        tagNom: personneTagTable.nom,
        email: sql<
          string | null
        >`(array_remove(array_agg(${invitationTable.email}), null))[1]`,
        invitationId: sql<
          string | null
        >`(array_remove(array_agg(${invitationTable.id}), null))[1]`,
      })
      .from(personneTagTable)
      .leftJoin(
        invitationPersonneTagTable,
        and(
          eq(invitationPersonneTagTable.tagId, personneTagTable.id),
          eq(invitationPersonneTagTable.tagNom, personneTagTable.nom)
        )
      )
      .leftJoin(
        invitationTable,
        and(
          eq(invitationPersonneTagTable.invitationId, invitationTable.id),
          eq(invitationTable.active, true)
        )
      )
      .where(
        applyPolicyWhere({
          policy: personneTagPolicy,
          mode: 'read',
          table: personneTagTable,
          scope,
          where: businessWhere,
        })
      )
      .groupBy(personneTagTable.id, personneTagTable.nom);
  }

  async convertTagsToUser({
    scope,
    userId,
    tagIds,
    collectiviteId,
    tx,
  }: {
    scope: Scope;
    userId: string;
    tagIds: number[];
    collectiviteId: number;
    tx?: Transaction;
  }): Promise<void> {
    if (
      !scopeHasPermission({
        scope,
        operation: 'collectivites.tags.mutate',
        resource: { collectiviteId },
      })
    ) {
      throw new ForbiddenException(
        `Droits insuffisants pour muter les tags de la collectivité ${collectiviteId}`
      );
    }
    if (tagIds.length === 0) {
      return;
    }
    const execute = async (trx: Transaction) => {
      const isMember = await this.listMembresService.isActiveMember({
        userId,
        collectiviteId,
        tx: trx,
      });
      if (!isMember) {
        throw new Error(
          `L'utilisateur ${userId} n'est pas rattaché à la collectivité ${collectiviteId}.`
        );
      }
      const tagsToAdd = await trx
        .select()
        .from(personneTagTable)
        .where(
          applyPolicyWhere({
            policy: personneTagPolicy,
            mode: 'write',
            table: personneTagTable,
            scope,
            where: inArray(personneTagTable.id, tagIds),
          })
        );

      for (const tag of tagsToAdd) {
        if (tag.collectiviteId !== collectiviteId) {
          throw new Error(
            `Le tag "${tag.nom}" (${tag.id}) appartient à la collectivité ${tag.collectiviteId} et non à la collectivité donnée ${collectiviteId}`
          );
        }
        this.logger.log(
          `Remplace le tag ${tag.nom} (${tag.id}) de la collectivité ${tag.collectiviteId} par l'utilisateur ${userId}`
        );
        await this.changeTagAndDelete(trx, tag.id, userId);
      }
    };
    if (tx) {
      await execute(tx);
    } else {
      await this.databaseService.db.transaction(async (newTrx) => {
        await execute(newTrx);
      });
    }
  }

  // Pas de scope : appelée uniquement après un filtrage policy en amont
  // (convertTagsToUser) ou depuis un flux interne (invitation.consumeInvitation)
  // où l'accès vient d'être accordé dans la même transaction.
  async changeTagAndDelete(
    trx: Transaction,
    tagId: number,
    userId: string
  ): Promise<void> {
    for (const table of tables) {
      await this.changeTagToUser(trx, tagId, userId, table);
    }
    await trx.delete(personneTagTable).where(eq(personneTagTable.id, tagId));
  }

  private async changeTagToUser(
    trx: Transaction,
    tagId: number,
    userId: string,
    table: PgTable & { tagId: AnyColumn }
  ): Promise<void> {
    const rows = await trx.select().from(table).where(eq(table.tagId, tagId));
    if (rows.length === 0) {
      return;
    }
    const pilotesToAdd = rows.map(({ id, ...row }) => {
      this.logger.log(
        `- Tag ${row.tagId} => Utilisateur ${userId} sur la table ${getTableName(
          table
        )}`
      );
      return { ...row, tagId: null, userId };
    });
    await trx.insert(table).values(pilotesToAdd).onConflictDoNothing();
    await trx.delete(table).where(eq(table.tagId, tagId));
  }
}
