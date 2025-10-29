import { CollectiviteMembresService } from '@/backend/collectivites/membres/membres.service';
import { ListPersonneTagsOutput } from '@/backend/collectivites/tags/personnes/list-personne-tags.output';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { ficheActionPiloteTable } from '@/backend/plans/fiches/shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '@/backend/plans/fiches/shared/models/fiche-action-referent.table';
import { actionPiloteTable } from '@/backend/referentiels/models/action-pilote.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { invitationPersonneTagTable } from '@/backend/users/invitations/invitation-personne-tag.table';
import { AuthUser } from '@/backend/users/models/auth.models';
import { invitationTable } from '@/backend/users/models/invitation.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { AnyColumn, and, eq, getTableName, inArray, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

/** Liste des tables ayant une référence vers personne_tag */
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
    private readonly permissionService: PermissionService,
    private readonly membresService: CollectiviteMembresService
  ) {}

  /**
   * Récupèrer les personne_tag demandés ainsi que leurs informations concernant les invitations
   * @param collectiviteId
   * @param tagIds
   * @param user
   */
  async listPersonneTags(
    collectiviteId: number,
    tagIds: number[]
  ): Promise<ListPersonneTagsOutput[]> {
    // Crée les conditions
    const conditionCol = eq(personneTagTable.collectiviteId, collectiviteId);
    const conditionId = inArray(personneTagTable.id, tagIds);

    // Crée et retourne la requête
    return this.databaseService.db
      .select({
        tagId: personneTagTable.id,
        tagNom: personneTagTable.nom,
        // Récupère la ligne contenant l'email non vide :
        // 1. supprime les nulls
        // 2. récupère l'élément en position 1 de l'array
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
      .where(tagIds.length > 0 ? and(conditionCol, conditionId) : conditionCol)
      .groupBy(personneTagTable.id, personneTagTable.nom);
  }

  /**
   * Attribue des tags à un utilisateur
   * @param userId
   * @param tagIds
   * @param collectiviteId
   * @param token
   * @param trx
   */
  async convertTagsToUser(
    userId: string,
    tagIds: number[],
    collectiviteId: number,
    token: AuthUser,
    trx?: Transaction
  ) {
    await this.permissionService.isAllowed(
      token,
      PermissionOperationEnum['COLLECTIVITES.TAGS.EDITION'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );
    if (tagIds.length == 0) {
      return;
    }
    const execute = async (tx: Transaction) => {
      // Vérifie que l'utilisateur donné appartient à la collectivité
      const isMember = await this.membresService.isActiveMember({
        userId,
        collectiviteId,
        tx,
      });

      if (!isMember) {
        throw new Error(
          `L'utilisateur ${userId} n'est pas rattaché à la collectivité ${collectiviteId}.`
        );
      }
      // Vérifie que les tags existent
      const tagsToAdd = await tx
        .select()
        .from(personneTagTable)
        .where(inArray(personneTagTable.id, tagIds));

      // Attribuer les tags
      for (const tag of tagsToAdd) {
        if (tag.collectiviteId != collectiviteId) {
          throw new Error(
            `Le tag "${tag.nom}" (${tag.id}) appartient à la collectivité ${tag.collectiviteId} et non à la collectivité donnée ${collectiviteId}`
          );
        }
        this.logger.log(
          `Remplace le tag ${tag.nom} (${tag.id}) de la collectivité ${tag.collectiviteId} par l'utilisateur ${userId} :`
        );
        await this.changeTagAndDelete(tx, tag.id, userId);
      }
    };
    // Exécuter les requêtes dans la transaction trx donnée si elle existe
    // Ou dans une nouvelle transaction si elle n'existe pas
    if (trx) {
      await execute(trx);
    } else {
      await this.databaseService.db.transaction(async (newTrx) => {
        await execute(newTrx);
      });
    }
  }

  /**
   * Change le tagId par userId dans toutes les tables liées puis supprime le tag
   * @trx
   * @tagId
   * @userId
   */
  async changeTagAndDelete(trx: Transaction, tagId: number, userId: string) {
    for (const table of tables) {
      await this.changeTagToUser(trx, tagId, userId, table);
    }
    // Supprime le tag
    await trx.delete(personneTagTable).where(eq(personneTagTable.id, tagId));
  }

  /**
   * Change tagId par userId dans la table demandée
   * @param trx
   * @param tagId
   * @param userId
   * @param table
   * @private
   */
  private async changeTagToUser(
    trx: Transaction,
    tagId: number,
    userId: string,
    table: PgTable & { tagId: AnyColumn }
  ) {
    // Récupère les enregistrements de la table
    const tags = await trx.select().from(table).where(eq(table.tagId, tagId));

    if (tags.length > 0) {
      // Transforme les enregistrements pour mettre userId au lieu de tagId
      const pilotesToAdd = tags.map(({ id, ...tag }) => {
        this.logger.log(
          `- Tag ${
            tag.tagId
          } => Utilisateur ${userId} sur la table ${getTableName(
            table
          )} (${tag})`
        );
        return {
          ...tag,
          tagId: null,
          userId: userId,
        };
      });

      // Ajoute les lignes transformées
      await trx.insert(table).values(pilotesToAdd).onConflictDoNothing(); // Plusieurs tags peuvent être attribués à la même personne

      // Supprime les anciens enregistrements ayant les tags
      await trx.delete(table).where(eq(table.tagId, tagId));
    }
  }
}
