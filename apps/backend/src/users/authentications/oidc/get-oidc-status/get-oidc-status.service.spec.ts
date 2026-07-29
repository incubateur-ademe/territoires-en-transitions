import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { describe, expect, test } from 'vitest';
import { OidcClientService } from '../oidc-client.service';
import { GetOidcStatusService } from './get-oidc-status.service';

/**
 * Construit un service avec des dépendances mockées :
 * - `mcaActif` : `getProviderConfig('moncompteademe')` renvoie une config ;
 * - `identites` : lignes `utilisateur_identite_oidc` renvoyées pour l'utilisateur ;
 * - `motDePasse` : l'utilisateur a un mot de passe chiffré.
 */
function buildService(opts: {
  mcaActif: boolean;
  identites?: Array<{ provider: string }>;
  motDePasse?: boolean;
}) {
  const oidcClientService = {
    getProviderConfig: (provider: string) =>
      provider === 'moncompteademe' && opts.mcaActif ? {} : null,
  } as unknown as OidcClientService;

  // Deux requêtes successives : identités liées, puis le compte (mot de passe).
  let appel = 0;
  const databaseService = {
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => {
              appel += 1;
              return Promise.resolve(
                appel === 1
                  ? opts.identites ?? []
                  : [{ encryptedPassword: opts.motDePasse ? 'hash' : null }]
              );
            },
          }),
        }),
      }),
    },
  } as unknown as DatabaseService;

  return new GetOidcStatusService(oidcClientService, databaseService);
}

describe('GetOidcStatusService — connexion unifiée MonCompteAdeme', () => {
  test('MCA activé → statut public enabled, provider ciblé', () => {
    const statut = buildService({ mcaActif: true }).getStatutPublic();

    expect(statut).toEqual({
      targetProvider: 'moncompteademe',
      enabled: true,
    });
  });

  test('MCA désactivé → enabled=false (endpoints inertes)', () => {
    const statut = buildService({ mcaActif: false }).getStatutPublic();

    expect(statut.enabled).toBe(false);
  });

  test('aucune identité MCA liée → hasLinkedIdentity=false', async () => {
    const statut = await buildService({
      mcaActif: true,
      identites: [],
      motDePasse: true,
    }).getStatutUtilisateur('user-1');

    expect(statut.hasLinkedIdentity).toBe(false);
    expect(statut.hasPassword).toBe(true);
  });

  test('identité MCA liée → hasLinkedIdentity=true', async () => {
    const statut = await buildService({
      mcaActif: true,
      identites: [{ provider: 'moncompteademe' }],
      motDePasse: false,
    }).getStatutUtilisateur('user-1');

    expect(statut.hasLinkedIdentity).toBe(true);
    expect(statut.hasPassword).toBe(false);
  });
});
