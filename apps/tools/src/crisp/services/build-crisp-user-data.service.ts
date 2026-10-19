import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { utilisateurIdentiteOidcTable } from '@tet/backend/users/authentications/oidc/models/utilisateur-identite-oidc.table';
import type { OidcProvider } from '@tet/backend/users/authentications/oidc/oidc.models';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { eq, sql } from 'drizzle-orm';
import { AirtableService } from '../../airtable/airtable.service';
import type { Database } from '../../utils/database/database.type';

export type CrispConnexionMode = 'ProConnect' | 'Email';

export type CrispUserData = {
  connexion: CrispConnexionMode;
  fiche_crm?: string;
};

// MonCompteAdeme étant adossé à ProConnect, toute identité OIDC liée compte
// comme ProConnect pour le support.
export const resolveConnexionMode = (
  providers: OidcProvider[]
): CrispConnexionMode => (providers.length > 0 ? 'ProConnect' : 'Email');

@Injectable()
export class BuildCrispUserDataService {
  constructor(
    @InjectDrizzle() private readonly db: Database,
    private readonly airtableService: AirtableService
  ) {}

  /** `null` si l'email ne correspond à aucun compte TeT. */
  async buildUserData(email: string): Promise<CrispUserData | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await this.db
      .select({
        id: authUsersTable.id,
        provider: utilisateurIdentiteOidcTable.provider,
      })
      .from(authUsersTable)
      .leftJoin(
        utilisateurIdentiteOidcTable,
        eq(utilisateurIdentiteOidcTable.userId, authUsersTable.id)
      )
      .where(eq(sql`lower(${authUsersTable.email})`, normalizedEmail));

    if (users.length === 0) {
      return null;
    }

    const providers = users
      .map((user) => user.provider)
      .filter((provider): provider is OidcProvider => provider !== null);

    const [crmUser] = await this.airtableService.getUsersByEmail([
      normalizedEmail,
    ]);

    return {
      connexion: resolveConnexionMode(providers),
      ...(crmUser?.url ? { fiche_crm: crmUser.url } : {}),
    };
  }
}
