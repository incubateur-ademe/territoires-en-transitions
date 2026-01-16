import { Injectable, Logger } from '@nestjs/common';
import { exportConnectTable } from '@tet/backend/collectivites/membres/export-connect.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { membreTable } from '@tet/backend/collectivites/shared/models/membre.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { ExportConnectCreate } from '@tet/domain/collectivites';
import { createHash } from 'crypto';
import {
  and,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
  notIlike,
  or,
  sql,
} from 'drizzle-orm';
import { pick } from 'es-toolkit';
import { utilisateurSupportTable } from '../../users/authorizations/roles/utilisateur-support.table';
import { utilisateurVerifieTable } from '../../users/authorizations/roles/utilisateur-verifie.table';
import { DatabaseService } from '../../utils/database/database.service';

type Utilisateurs = Awaited<
  ReturnType<ExportConnectService['getUtilisateurs']>
>;
type Collectivites = Awaited<
  ReturnType<ExportConnectService['getCollectivites']>
>;
type Membre = Awaited<ReturnType<ExportConnectService['getMembres']>>[number];
type MembreFiltre = Omit<Membre, 'checksum'> & { checksum: string };

const exportedFields = [
  'email',
  'nom',
  'prenom',
  'telephone',
  'siren',
  'nic',
  'detailsFonction',
] as const;

/** Permet de lister les membres des collectivités à exporter vers le CRM Connect */
@Injectable()
export class ExportConnectService {
  private readonly logger = new Logger(ExportConnectService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  /** Liste les membres à exporter */
  async list(user: AuthUser) {
    this.logger.log(`Récupération des membres à exporter vers Connect`);
    this.permissionService.hasServiceRole(user);

    const utilisateurs = this.getUtilisateurs();
    const collectivites = this.getCollectivites(utilisateurs);
    const membres = await this.getMembres(utilisateurs, collectivites);

    // filtre les membres pour lesquels la checksum n'a pas changée depuis le
    // dernier traitement enregistré
    const membresFiltres = membres
      .map((membre: Membre) => {
        const checksum = this.getChecksum(membre);
        return checksum === membre.checksum ? null : { ...membre, checksum };
      })
      .filter(Boolean) as MembreFiltre[];

    this.logger.log(
      `${membresFiltres.length} membre(s) à exporter vers Connect`
    );

    return membresFiltres;
  }

  /** Ajoute ou met à jour la liste des membres exportés */
  async upsert(membres: ExportConnectCreate[], user: AuthUser) {
    if (!membres.length) {
      return;
    }
    this.logger.log(
      `Enregistre la liste des membres (${membres.length}) exportés vers Connect`
    );
    this.permissionService.hasServiceRole(user);

    const modifiedAt = new Date().toISOString();
    const rows = membres.map(({ userId, exportId, checksum }) => ({
      userId,
      exportId,
      checksum,
      modifiedAt,
    }));

    const ret = await this.databaseService.db
      .insert(exportConnectTable)
      .values(rows)
      .onConflictDoUpdate({
        target: exportConnectTable.userId,
        set: buildConflictUpdateColumns(exportConnectTable, [
          'checksum',
          'exportId',
          'modifiedAt',
        ]),
      });

    this.logger.log(`${ret.rowCount} membre(s) exportés vers Connect`);
  }

  /**
   * Sélectionne les utilisateurs vérifiés, non support, actifs,
   * et avec une adresse mail valide (qui ne contient pas ademe, beta.gouv et +)
   */
  private getUtilisateurs() {
    return this.databaseService.db
      .select({
        userId: authUsersTable.id,
      })
      .from(authUsersTable)
      .leftJoin(
        utilisateurVerifieTable,
        eq(utilisateurVerifieTable.userId, authUsersTable.id)
      )
      .leftJoin(
        utilisateurSupportTable,
        eq(utilisateurSupportTable.userId, authUsersTable.id)
      )
      .where(
        and(
          isNotNull(authUsersTable.email),
          notIlike(authUsersTable.email, '%ademe%'),
          notIlike(authUsersTable.email, '%beta.gouv.fr%'),
          notIlike(authUsersTable.email, '%+%'),
          eq(utilisateurVerifieTable.verifie, true),
          ne(utilisateurSupportTable.isSupport, true)
        )
      )
      .as('utilisateurs');
  }

  /**
   * Sélectionne les collectivités non "test" rattachés aux utilisateurs donnés
   */
  private getCollectivites(utilisateurs: Utilisateurs) {
    return this.databaseService.db
      .select({
        userId: utilisateurs.userId,
        collectiviteIds: sql<
          number[]
        >`array_agg(distinct ${collectiviteTable.id})`.as('collectiviteIds'),
      })
      .from(utilisateurs)
      .leftJoin(
        utilisateurCollectiviteAccessTable,
        eq(utilisateurCollectiviteAccessTable.userId, utilisateurs.userId)
      )
      .leftJoin(
        collectiviteTable,
        eq(
          collectiviteTable.id,
          utilisateurCollectiviteAccessTable.collectiviteId
        )
      )
      .where(
        and(
          isNotNull(utilisateurCollectiviteAccessTable.collectiviteId),
          isNotNull(collectiviteTable.siren),
          ne(collectiviteTable.type, 'test')
        )
      )
      .groupBy(utilisateurs.userId)
      .as('collectivites');
  }

  /**
   * Sélectionne les membres uniquement équipe politique et technique ou
   * sans fonction, et rattachés à une seule collectivité
   */
  private async getMembres(
    utilisateurs: Utilisateurs,
    collectivites: Collectivites
  ) {
    return this.databaseService.db
      .select({
        collectivite: collectiviteTable.nom,
        siren: collectiviteTable.siren,
        nic: collectiviteTable.nic,
        userId: collectivites.userId,
        email: sql<string>`lower(${dcpTable.email})`.as('email'),
        prenom: dcpTable.prenom,
        nom: dcpTable.nom,
        telephone: dcpTable.telephone,
        fonction: membreTable.fonction,
        detailsFonction: membreTable.detailsFonction,
        checksum: exportConnectTable.checksum,
        exportId: exportConnectTable.exportId,
      })
      .from(collectivites)
      .leftJoin(utilisateurs, eq(utilisateurs.userId, collectivites.userId))
      .leftJoin(dcpTable, eq(dcpTable.id, utilisateurs.userId))
      .leftJoin(
        membreTable,
        and(
          eq(membreTable.userId, utilisateurs.userId),
          eq(
            membreTable.collectiviteId,
            sql`any(${collectivites.collectiviteIds})`
          )
        )
      )
      .leftJoin(
        collectiviteTable,
        eq(collectiviteTable.id, sql`any(${collectivites.collectiviteIds})`)
      )
      .leftJoin(
        exportConnectTable,
        eq(exportConnectTable.userId, utilisateurs.userId)
      )
      .where(
        and(
          eq(sql`array_length(${collectivites.collectiviteIds}, 1)`, 1),
          or(
            isNull(membreTable.fonction),
            inArray(membreTable.fonction, ['politique', 'technique'])
          )
        )
      );
  }

  /** Calcule la checksum d'un membre à exporter */
  getChecksum(membre: Membre) {
    const data = pick(membre, exportedFields);
    const s = JSON.stringify(data, Object.keys(data).sort());
    return createHash('md5').update(s).digest('hex');
  }
}
