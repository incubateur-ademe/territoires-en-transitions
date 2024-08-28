import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { and, eq, inArray, SQL, SQLWrapper } from 'drizzle-orm';
import DatabaseService from '../../common/services/database.service';
import {
  NiveauAcces,
  niveauAccessOrdonne,
  SupabaseJwtPayload,
  SupabaseRole,
  utilisateurDroitTable,
  UtilisateurDroitType,
} from '../models/auth.models';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  aDroitsSuffisants(
    tokenRole: SupabaseRole,
    droits: UtilisateurDroitType[],
    collectiviteIds: number[],
    niveauAccessMinimum: NiveauAcces,
  ): boolean {
    if (tokenRole === SupabaseRole.SERVICE_ROLE) {
      this.logger.log(
        `Rôle de service détecté, accès autorisé à toutes les collectivités`,
      );
      return true;
    } else if (tokenRole === SupabaseRole.AUTHENTICATED) {
      const niveauAccessMinimumIndex =
        niveauAccessOrdonne.indexOf(niveauAccessMinimum);

      for (const collectiviteId of collectiviteIds) {
        const droit = droits.find(
          (droit) =>
            droit.collectivite_id.toString() === collectiviteId.toString(), // Etrangement collectiviteId est un string
        );
        if (!droit) {
          this.logger.log(
            `Droit introuvable pour la collectivité ${collectiviteId}`,
          );
          return false;
        }

        if (!droit.active) {
          this.logger.log(
            `Droit inactif pour la collectivité ${collectiviteId} et l'utilisateur ${droit.user_id}`,
          );
          return false;
        }

        const droitNiveauAccessIndex = niveauAccessOrdonne.indexOf(
          droit.niveau_acces,
        );
        if (droitNiveauAccessIndex < niveauAccessMinimumIndex) {
          this.logger.log(
            `Niveau d'accès insuffisant pour la collectivité ${collectiviteId} et l'utilisateur ${droit.user_id} (niveau d'accès: ${droit.niveau_acces}, demandé: ${niveauAccessMinimum})`,
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
    collectiviteIds?: number[],
  ): Promise<UtilisateurDroitType[]> {
    this.logger.log(
      `Récupération des droits de l'utilisateur ${userId} et les collectivités ${collectiviteIds?.join(', ')}`,
    );
    const conditions: (SQLWrapper | SQL)[] = [
      eq(utilisateurDroitTable.user_id, userId),
    ];
    if (collectiviteIds?.length) {
      conditions.push(
        inArray(utilisateurDroitTable.collectivite_id, collectiviteIds),
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
    doNotThrow?: boolean,
  ): Promise<boolean> {
    let droits: UtilisateurDroitType[] = [];
    const userId = tokenInfo.sub;
    if (tokenInfo.role === SupabaseRole.AUTHENTICATED && userId) {
      droits = await this.getDroitsUtilisateur(userId, collectiviteIds);
    }
    const authorise = this.aDroitsSuffisants(
      tokenInfo.role,
      droits,
      collectiviteIds,
      niveauAccessMinimum,
    );
    if (!authorise && !doNotThrow) {
      throw new UnauthorizedException(`Droits insuffisants`);
    }
    return authorise;
  }
}
