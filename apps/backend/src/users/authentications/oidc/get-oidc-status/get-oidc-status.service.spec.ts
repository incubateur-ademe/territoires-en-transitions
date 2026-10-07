import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { describe, expect, test } from 'vitest';
import { OidcProvider } from '../oidc.models';
import { OidcClientService } from '../oidc-client.service';
import { GetOidcStatusService } from './get-oidc-status.service';

/**
 * Construit un service avec des dépendances mockées :
 * - `providersActifs` : providers pour lesquels `getProviderConfig` renvoie une config ;
 * - `identites` : lignes `utilisateur_identite_oidc` renvoyées pour l'utilisateur ;
 * - `motDePasse` : l'utilisateur a un mot de passe chiffré.
 */
function buildService(opts: {
  providersActifs: OidcProvider[];
  identites?: Array<{ provider: string }>;
  motDePasse?: boolean;
}) {
  const oidcClientService = {
    getProviderConfig: (provider: string) =>
      opts.providersActifs.includes(provider as OidcProvider) ? {} : null,
  } as unknown as OidcClientService;

  // Deux requêtes successives : le compte (mot de passe), puis les identités liées.
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
                  ? [{ encryptedPassword: opts.motDePasse ? 'hash' : null }]
                  : opts.identites ?? []
              );
            },
          }),
        }),
      }),
    },
  } as unknown as DatabaseService;

  return new GetOidcStatusService(oidcClientService, databaseService);
}

describe('GetOidcStatusService — provider OIDC mis en avant', () => {
  test('MCA activé → provider ciblé MCA', () => {
    const statut = buildService({
      providersActifs: ['moncompteademe'],
    }).getStatutPublic();

    expect(statut).toEqual({
      targetProvider: 'moncompteademe',
      enabled: true,
    });
  });

  test('MCA et ProConnect activés → MCA prioritaire', () => {
    const statut = buildService({
      providersActifs: ['moncompteademe', 'proconnect'],
    }).getStatutPublic();

    expect(statut.targetProvider).toBe('moncompteademe');
  });

  test('ProConnect seul activé → repli sur ProConnect', () => {
    const statut = buildService({
      providersActifs: ['proconnect'],
    }).getStatutPublic();

    expect(statut).toEqual({
      targetProvider: 'proconnect',
      enabled: true,
    });
  });

  test('aucun provider activé → enabled=false, aucun provider ciblé', () => {
    const statut = buildService({ providersActifs: [] }).getStatutPublic();

    expect(statut).toEqual({
      targetProvider: null,
      enabled: false,
    });
  });

  test('aucune identité liée → hasLinkedIdentity=false', async () => {
    const statut = await buildService({
      providersActifs: ['moncompteademe'],
      identites: [],
      motDePasse: true,
    }).getStatutUtilisateur('user-1');

    expect(statut.hasLinkedIdentity).toBe(false);
    expect(statut.hasPassword).toBe(true);
  });

  test('identité liée au provider ciblé → hasLinkedIdentity=true', async () => {
    const statut = await buildService({
      providersActifs: ['moncompteademe'],
      identites: [{ provider: 'moncompteademe' }],
      motDePasse: false,
    }).getStatutUtilisateur('user-1');

    expect(statut.hasLinkedIdentity).toBe(true);
    expect(statut.hasPassword).toBe(false);
  });

  test('aucun provider activé → statut utilisateur sans liaison, mot de passe conservé', async () => {
    const statut = await buildService({
      providersActifs: [],
      identites: [{ provider: 'moncompteademe' }],
      motDePasse: true,
    }).getStatutUtilisateur('user-1');

    expect(statut.hasLinkedIdentity).toBe(false);
    expect(statut.hasPassword).toBe(true);
  });
});
