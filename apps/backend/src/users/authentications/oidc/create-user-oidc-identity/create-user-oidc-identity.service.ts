import { Injectable, Logger } from '@nestjs/common';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { LoginUserWithOidcProviderService } from '../login-user-with-oidc-provider/login-user-with-oidc-provider.service';
import { CreateSupabaseSessionService } from '../create-supabase-session.service';
import { OidcClaims, OidcProvider } from '../oidc.models';
import { LinkOidcIdentityToUserService } from '../link-oidc-identity-to-user/link-oidc-identity-to-user.service';

export const creerCompteOidcErrors = [
  'CREATION_COMPTE_ERROR',
  'SESSION_ERROR',
  'EMAIL_NON_VERIFIE',
] as const;
export type CreateUserOidcIdentityError = (typeof creerCompteOidcErrors)[number];

export type CreateUserOidcIdentityResult = {
  /** `true` si un compte a été créé ; `false` si un compte existait déjà (double-clic, défense en profondeur). */
  compteCree: boolean;
  hashedToken: string;
};

/**
 * Création de compte du cas 3-Non : l'utilisateur a répondu « Non, je
 * n'ai pas de compte » à la dialog de bienvenue. Le ticket signé (émis au
 * callback OIDC, cf. `ticket-oidc.service.ts`) transporte les claims déjà
 * vérifiés — jamais de claims fournis autrement par le navigateur.
 */
@Injectable()
export class CreateUserOidcIdentityService {
  private readonly logger = new Logger(CreateUserOidcIdentityService.name);

  constructor(
    private readonly authentifierOidcService: LoginUserWithOidcProviderService,
    private readonly rattacherIdentiteService: LinkOidcIdentityToUserService,
    private readonly supabaseService: SupabaseService,
    private readonly creerSessionService: CreateSupabaseSessionService
  ) {}

  async creerCompte(
    provider: OidcProvider,
    claims: OidcClaims
  ): Promise<Result<CreateUserOidcIdentityResult, CreateUserOidcIdentityError>> {
    // Défense en profondeur contre un double-clic / re-soumission du ticket :
    // on rejoue le même matching que le callback (sub OU email vérifié). S'il
    // trouve désormais un compte (créé entre-temps par une première requête,
    // ou lié entre-temps), on ne crée jamais de doublon — `authentifier`
    // rattache déjà l'identité si besoin (cas 2) — on ponte juste la session.
    const authentification = await this.authentifierOidcService.authentifier(
      provider,
      claims
    );

    if (authentification.statut === 'compte-desactive') {
      // Ne devrait pas arriver ici (le cas 3 initial était `non-reconnu`),
      // mais reste possible si le compte a été désactivé entre le callback
      // et la réponse à la dialog de bienvenue. Pas de création, pas de session.
      this.logger.warn(
        `Création de compte OIDC ${provider} (sub: ${claims.sub}) : compte désactivé détecté au moment de la création, abandon`
      );
      return failure('SESSION_ERROR');
    }

    if (authentification.statut === 'connexion') {
      this.logger.log(
        `Création de compte OIDC ${provider} (sub: ${claims.sub}) : compte déjà existant détecté (double-clic ou re-soumission), aucune création — reconnexion normale de ${authentification.userId}`
      );
      return this.ponterSession(authentification.email, false);
    }

    if (authentification.statut === 'email-non-verifie') {
      // Un compte existe pour cet email mais il n'est pas vérifié : on ne crée
      // pas de doublon (l'INSERT échouerait sur l'email unique de toute façon)
      // — l'app affiche l'alerte « vérifiez votre email ».
      this.logger.warn(
        `Création de compte OIDC ${provider} (sub: ${claims.sub}) : email non vérifié correspondant à un compte existant, création refusée`
      );
      return failure('EMAIL_NON_VERIFIE');
    }

    return this.creerNouveauCompte(provider, claims);
  }

  private async creerNouveauCompte(
    provider: OidcProvider,
    claims: OidcClaims
  ): Promise<Result<CreateUserOidcIdentityResult, CreateUserOidcIdentityError>> {
    const { data, error } =
      await this.supabaseService.client.auth.admin.createUser({
        email: claims.email,
        email_confirm: true,
        user_metadata: {
          nom: claims.usual_name,
          prenom: claims.given_name,
        },
      });

    if (error || !data.user) {
      this.logger.error(
        `Echec de la création de compte OIDC ${provider} (sub: ${
          claims.sub
        }): ${
          error?.message ?? 'auth.admin.createUser sans utilisateur retourné'
        }`
      );
      return failure('CREATION_COMPTE_ERROR');
    }

    // Le trigger Postgres `sync_dcp` crée automatiquement la ligne
    // `public.dcp` à partir de `raw_user_meta_data->>'nom'|'prenom'` dès
    // l'INSERT dans `auth.users` — rien à écrire nous-même dans `dcp`.
    const userId = data.user.id;

    // Pas de transaction englobant création + rattachement : `createUser`
    // est un appel API externe non transactionnel (Supabase Auth REST) —
    // une transaction locale ne pourrait couvrir QUE l'insert
    // `identite_oidc` (une seule ligne), ce qui n'apporte aucune garantie
    // d'atomicité supplémentaire. Sur-ingénierie évitée (cf. consigne).
    await this.rattacherIdentiteService.rattacherIdentite(
      provider,
      userId,
      claims
    );

    this.logger.log(
      `Compte créé via OIDC ${provider} (sub: ${claims.sub}, cas 3-Non, U5) : ${userId}`
    );

    return this.ponterSession(claims.email, true);
  }

  private async ponterSession(
    email: string,
    compteCree: boolean
  ): Promise<Result<CreateUserOidcIdentityResult, CreateUserOidcIdentityError>> {
    const session = await this.creerSessionService.creerSession(email);
    if (!session.success) {
      return failure('SESSION_ERROR');
    }
    return success({ compteCree, hashedToken: session.data.hashedToken });
  }
}
