import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { and, eq, inArray, SQL, SQLWrapper } from 'drizzle-orm';
import DatabaseService from '../../common/services/database.service';
import {
  NiveauAcces,
  niveauAccessOrdonne,
  utilisateurDroitTable,
  UtilisateurDroitType,
} from '../models/private-utilisateur-droit.table';
import {
  SupabaseJwtPayload,
  SupabaseRole,
} from '../models/supabase-jwt.models';
import CollectivitesService from '../../collectivites/services/collectivites.service';
import { utilisateurSupportTable } from '../models/utilisateur-support.table';
import { utilisateurVerifieTable } from '../models/utilisateur-verifie.table';
import { userCrm } from '../models/user-crm.dto';
import { dcpTable } from '../models/dcp.table';
import { authUsersTable } from '../models/auth-users.table';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly collectiviteService: CollectivitesService
  ) {}

  aDroitsSuffisants(
    tokenRole: SupabaseRole,
    droits: UtilisateurDroitType[],
    collectiviteIds: number[],
    niveauAccessMinimum: NiveauAcces
  ): boolean {
    if (tokenRole === SupabaseRole.SERVICE_ROLE) {
      this.logger.log(
        `Rôle de service détecté, accès autorisé à toutes les collectivités`
      );
      return true;
    } else if (tokenRole === SupabaseRole.AUTHENTICATED) {
      const niveauAccessMinimumIndex =
        niveauAccessOrdonne.indexOf(niveauAccessMinimum);

      for (const collectiviteId of collectiviteIds) {
        const droit = droits.find(
          (droit) =>
            droit.collectiviteId.toString() === collectiviteId.toString() // Etrangement collectiviteId est un string
        );
        if (!droit) {
          this.logger.log(
            `Droit introuvable pour la collectivité ${collectiviteId}`
          );
          return false;
        }

        if (!droit.active) {
          this.logger.log(
            `Droit inactif pour la collectivité ${collectiviteId} et l'utilisateur ${droit.userId}`
          );
          return false;
        }

        const droitNiveauAccessIndex = niveauAccessOrdonne.indexOf(
          droit.niveauAcces
        );
        if (droitNiveauAccessIndex < niveauAccessMinimumIndex) {
          this.logger.log(
            `Niveau d'accès insuffisant pour la collectivité ${collectiviteId} et l'utilisateur ${droit.userId} (niveau d'accès: ${droit.niveauAcces}, demandé: ${niveauAccessMinimum})`
          );
          return false;
        }
      }
      return true;
    }
    return false;
  }

  async getDroitsUtilisateur(
    userId: string,
    collectiviteIds?: number[]
  ): Promise<UtilisateurDroitType[]> {
    this.logger.log(
      `Récupération des droits de l'utilisateur ${userId} et les collectivités ${collectiviteIds?.join(
        ', '
      )}`
    );
    const conditions: (SQLWrapper | SQL)[] = [
      eq(utilisateurDroitTable.userId, userId),
    ];
    if (collectiviteIds?.length) {
      conditions.push(
        inArray(utilisateurDroitTable.collectiviteId, collectiviteIds)
      );
    }
    const droits = await this.databaseService.db
      .select()
      .from(utilisateurDroitTable)
      .where(and(...conditions));
    this.logger.log(`${droits.length} droits récupérés`);
    return droits;
  }

  async verifieAccesAuxCollectivites(
    tokenInfo: SupabaseJwtPayload,
    collectiviteIds: number[],
    niveauAccessMinimum: NiveauAcces,
    doNotThrow?: boolean
  ): Promise<boolean> {
    let droits: UtilisateurDroitType[] = [];
    const userId = tokenInfo?.sub;
    if (tokenInfo?.role === SupabaseRole.AUTHENTICATED && userId) {
      droits = await this.getDroitsUtilisateur(userId, collectiviteIds);
    }
    const authorise = this.aDroitsSuffisants(
      tokenInfo?.role,
      droits,
      collectiviteIds,
      niveauAccessMinimum
    );
    if (!authorise && !doNotThrow) {
      throw new UnauthorizedException(`Droits insuffisants`);
    }
    return authorise;
  }

  /**
   * Vérifie si l'utilisateur a un rôle support
   * @param tokenInfo token de l'utilisateur
   * @return vrai si l'utilisateur a un rôle support
   */
  async estSupport(tokenInfo: SupabaseJwtPayload): Promise<boolean> {
    const userId = tokenInfo.sub;
    if (tokenInfo.role === SupabaseRole.AUTHENTICATED && userId) {
      const result = await this.databaseService.db
        .select()
        .from(utilisateurSupportTable)
        .where(eq(utilisateurSupportTable.userId, userId));
      return result[0].support || false;
    }
    return false;
  }

  /**
   * Vérifie si l'utilisateur est vérifié
   * @param tokenInfo token de l'utilisateur
   * @return vrai si l'utilisateur est vérifié
   */
  async estVerifie(tokenInfo: SupabaseJwtPayload): Promise<boolean> {
    const userId = tokenInfo.sub;
    if (tokenInfo.role === SupabaseRole.AUTHENTICATED && userId) {
      const result = await this.databaseService.db
        .select()
        .from(utilisateurVerifieTable)
        .where(eq(utilisateurVerifieTable.userId, userId));
      return result[0].verifie || false;
    }
    return false;
  }

  /**
   * Vérifie si un utilisateur a accès en lecture à une collectivité
   * en prenant en compte la restriction possible de la collectivité
   * @param tokenInfo token de l'utilisateur
   * @param collectiviteId identifiant de la collectivité
   * @param doNotThrow vrai pour ne pas générer une exception
   */
  async verifieAccesRestreintCollectivite(
    tokenInfo: SupabaseJwtPayload,
    collectiviteId: number,
    doNotThrow?: boolean
  ): Promise<boolean> {
    if (tokenInfo.role === SupabaseRole.SERVICE_ROLE) {
      this.logger.log(
        `Rôle de service détecté, accès autorisé à toutes les collectivités`
      );
      return true;
    } else if (tokenInfo.role === SupabaseRole.AUTHENTICATED) {
      let authorise = false;
      const collectivite = await this.collectiviteService.getCollectivite(
        collectiviteId
      );
      if (collectivite.collectivite.accessRestreint) {
        // Si la collectivité est en accès restreint, l'utilisateur doit :
        // avoir un droit en lecture sur la collectivité, ou avoir un rôle support,
        // ou être un auditeur d'un audit courant de la collectivité.
        authorise =
          (await this.verifieAccesAuxCollectivites(
            tokenInfo,
            [collectiviteId],
            NiveauAcces.LECTURE,
            doNotThrow
          )) || (await this.estSupport(tokenInfo)); // TODO || private.est_auditeur(collectivite_id)
      } else {
        // Si la collectivité n'est pas en accès restreint, l'utilisateur doit :
        // être vérifié, ou s'il ne l'est pas, avoir un droit en lecture sur la collectivité.
        authorise =
          (await this.estVerifie(tokenInfo)) ||
          (await this.verifieAccesAuxCollectivites(
            tokenInfo,
            [collectiviteId],
            NiveauAcces.LECTURE,
            doNotThrow
          ));
      }
      if (!authorise && !doNotThrow) {
        throw new UnauthorizedException(`Droits insuffisants`);
      }
      return authorise;
    }
    return false;
  }

  /**
   * Récupère les informations de l'utilisateur utiles pour le dialogue avec des crms
   * @param tokenInfo token de l'utilisateur
   * @return les informations crm de l'utilisateur
   */
  async getUserCrmInfo(tokenInfo: SupabaseJwtPayload): Promise<userCrm | null> {
    if (tokenInfo.sub) {
      const result = await this.databaseService.db
        .select({
          prenom: dcpTable.prenom,
          nom: dcpTable.nom,
          email: dcpTable.email,
          telephone: dcpTable.telephone,
          creation: authUsersTable.createdAt,
          derniereConnexion: authUsersTable.lastSignInAt,
        })
        .from(dcpTable)
        .innerJoin(authUsersTable, eq(dcpTable.userId, authUsersTable.id))
        .where(eq(dcpTable.userId, tokenInfo.sub));
      return result[0] || null;
    }
    return null;
  }
}
