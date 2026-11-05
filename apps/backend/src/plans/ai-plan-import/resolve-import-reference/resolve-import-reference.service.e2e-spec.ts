import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { groupementCollectiviteTable } from '@tet/backend/collectivites/shared/models/groupement-collectivite.table';
import { groupementTable } from '@tet/backend/collectivites/shared/models/groupement.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { ficheActionSharingTable } from '@tet/backend/plans/fiches/share-fiches/fiche-action-sharing.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-axe.table';
import { ficheActionIndicateurTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { GenerateImportDraftWorker } from '../generate-import-draft/generate-import-draft.worker';
import { ResolveImportReferenceService } from './resolve-import-reference.service';

describe('Résolution des liens TeT pour un import', () => {
  const llm = new FakeLlmRepository();
  let app: INestApplication;
  let db: DatabaseService;
  let service: ResolveImportReferenceService;
  let appUrl: string;
  let context: Awaited<ReturnType<typeof createContext>>;

  const createContext = async (
    role: CollectiviteRole = CollectiviteRole.EDITION,
    accesRestreint = true
  ) => {
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role },
      collectivite: { accesRestreint },
    });
    return {
      collectiviteId: collectivite.id,
      user: getAuthUserFromUserCredentials(user),
    };
  };
  const ficheUrl = (ficheId: number, collectiviteId = context.collectiviteId) =>
    `${appUrl}/collectivite/${collectiviteId}/actions/${ficheId}/details`;
  const indicateurUrl = (
    indicateurId: number,
    collectiviteId = context.collectiviteId
  ) =>
    `${appUrl}/collectivite/${collectiviteId}/indicateurs/perso/${indicateurId}`;
  const resolveFiche = (url: string) =>
    service.resolveFiche(url, context.collectiviteId, { user: context.user });
  const resolveIndicateur = (url: string) =>
    service.resolveIndicateur(url, context.collectiviteId, {
      user: context.user,
    });
  const createFiche = async (
    overrides: Partial<typeof ficheActionTable.$inferInsert> = {}
  ) => {
    const [fiche] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: context.collectiviteId,
        titre: 'Fiche existante',
        description: 'Description conservée',
        ...overrides,
      })
      .returning();
    return fiche;
  };
  const createIndicateur = async (
    overrides: Partial<typeof indicateurDefinitionTable.$inferInsert> = {}
  ) => {
    const [indicateur] = await db.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId: context.collectiviteId,
        titre: 'Indicateur existant',
        unite: 'MWh',
        periodicite: 'mensuelle',
        ...overrides,
      })
      .returning();
    return indicateur;
  };
  const expectFailure = (
    result:
      | Awaited<ReturnType<typeof resolveFiche>>
      | Awaited<ReturnType<typeof resolveIndicateur>>,
    code: string
  ) => {
    expect(result.success).toBe(false);
    assert(!result.success);
    expect(result.error).toContainEqual(expect.objectContaining({ code }));
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder.overrideProvider(LlmService).useValue(new LlmService(llm));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
      },
    });
    db = await getTestDatabase(app);
    service = app.get(ResolveImportReferenceService);
    appUrl = new URL(app.get(ConfigurationService).get('APP_URL')).origin;
  });
  beforeEach(async () => {
    vi.spyOn(llm, 'complete');
    vi.spyOn(llm, 'chat');
    context = await createContext();
  });
  afterEach(() => {
    expect(llm.complete).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
  afterAll(async () => {
    await app?.close();
  });

  test('résout une fiche par ID sans modifier ses champs, ses sous-actions ou ses liens', async () => {
    const fiche = await createFiche();
    const enfant = await createFiche({
      parentId: fiche.id,
      titre: 'Sous-action conservée',
    });
    const indicateur = await createIndicateur();
    const [axe] = await db.db
      .insert(axeTable)
      .values({ collectiviteId: context.collectiviteId, nom: 'Plan existant' })
      .returning();
    const [lienAxe] = await db.db
      .insert(ficheActionAxeTable)
      .values({ ficheId: fiche.id, axeId: axe.id, createdBy: context.user.id })
      .returning();
    const [lienIndicateur] = await db.db
      .insert(ficheActionIndicateurTable)
      .values({
        ficheId: fiche.id,
        indicateurId: indicateur.id,
        createdBy: context.user.id,
      })
      .returning();

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      expect(
        await resolveFiche(`${ficheUrl(fiche.id)}?planId=${axe.id}#titre`)
      ).toEqual({ success: true, data: { ficheId: fiche.id } });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
    expect(
      await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, fiche.id))
    ).toEqual([fiche]);
    expect(
      await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, enfant.id))
    ).toEqual([enfant]);
    expect(
      await db.db
        .select()
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.ficheId, fiche.id))
    ).toEqual([lienAxe]);
    expect(
      await db.db
        .select()
        .from(ficheActionIndicateurTable)
        .where(eq(ficheActionIndicateurTable.ficheId, fiche.id))
    ).toEqual([lienIndicateur]);
  });

  test.each([
    'plans/fiches',
    'plans/42/fiches',
    'plans/actions',
    'plans/42/actions',
  ])('résout la redirection maintenue /%s sans requête HTTP', async (path) => {
    const fiche = await createFiche();
    expect(
      await resolveFiche(
        `${appUrl}/collectivite/${context.collectiviteId}/${path}/${fiche.id}/notes`
      )
    ).toEqual({ success: true, data: { ficheId: fiche.id } });
  });

  test('accepte le lien de production et le lien configuré pour cette instance', async () => {
    const fiche = await createFiche();
    expect(
      await resolveFiche(
        `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/actions/${fiche.id}`
      )
    ).toEqual({ success: true, data: { ficheId: fiche.id } });
    expect(await resolveFiche(ficheUrl(fiche.id))).toEqual({
      success: true,
      data: { ficheId: fiche.id },
    });
  });

  test.each([
    'https://app.territoiresentransitions.fr.evil.test/collectivite/1/actions/2/details',
    'https://app.territoiresentransitions.fr@evil.test/collectivite/1/actions/2/details',
    'https://user:password@app.territoiresentransitions.fr/collectivite/1/actions/2/details',
    'https://app.territoiresentransitions.fr/collectivite/1/actions/2/documents/3',
    'https://app.territoiresentransitions.fr/collectivite/1/actions/2/inconnu',
    'https://app.territoiresentransitions.fr/collectivite/1/actions/0/details',
    'https://app.territoiresentransitions.fr/collectivite/1/actions/2147483648/details',
    'https://app.territoiresentransitions.fr/collectivite/1/actions/2\n/details',
    '/collectivite/1/actions/2/details',
    'javascript:alert(1)',
    'https://app.territoiresentransitions.fr/collectivite/1/actions/2/details, https://app.territoiresentransitions.fr/collectivite/1/actions/3/details',
  ])('bloque un lien non reconnu : %s', async (url) => {
    expectFailure(await resolveFiche(url), 'INVALID_IMPORT_REFERENCE_URL');
  });

  test('signale explicitement un ancien UID de fiche sans inventer de correspondance', async () => {
    expectFailure(
      await resolveFiche(
        `${appUrl}/collectivite/${
          context.collectiviteId
        }/actions/${randomUUID()}/details`
      ),
      'UNSUPPORTED_FICHE_UID'
    );
  });

  test('bloque une fiche absente ou supprimée', async () => {
    expectFailure(
      await resolveFiche(ficheUrl(2147483647)),
      'FICHE_REFERENCE_UNAVAILABLE'
    );
    const fiche = await createFiche({ deleted: true });
    expectFailure(
      await resolveFiche(ficheUrl(fiche.id)),
      'FICHE_REFERENCE_UNAVAILABLE'
    );
  });

  test('ne déduit pas un droit de liaison de la lecture publique dans une autre collectivité', async () => {
    const autre = await createContext(CollectiviteRole.EDITION, false);
    const fiche = await createFiche({ collectiviteId: autre.collectiviteId });
    expectFailure(
      await resolveFiche(ficheUrl(fiche.id, autre.collectiviteId)),
      'FICHE_REFERENCE_UNAVAILABLE'
    );
  });

  test('accepte une fiche partagée avec la cible et rejette une URL dans une collectivité étrangère', async () => {
    const autre = await createContext();
    const fiche = await createFiche({
      collectiviteId: autre.collectiviteId,
      restreint: true,
    });
    await db.db
      .insert(ficheActionSharingTable)
      .values({ ficheId: fiche.id, collectiviteId: context.collectiviteId });
    expect(
      await resolveFiche(ficheUrl(fiche.id, autre.collectiviteId))
    ).toEqual({ success: true, data: { ficheId: fiche.id } });
    expect(await resolveFiche(ficheUrl(fiche.id))).toEqual({
      success: true,
      data: { ficheId: fiche.id },
    });
    expectFailure(
      await resolveFiche(ficheUrl(fiche.id, 2147483647)),
      'FICHE_REFERENCE_UNAVAILABLE'
    );
  });

  test('revérifie le partage à chaque résolution', async () => {
    const autre = await createContext();
    const fiche = await createFiche({ collectiviteId: autre.collectiviteId });
    await db.db
      .insert(ficheActionSharingTable)
      .values({ ficheId: fiche.id, collectiviteId: context.collectiviteId });
    expect(
      (await resolveFiche(ficheUrl(fiche.id, autre.collectiviteId))).success
    ).toBe(true);
    await db.db
      .delete(ficheActionSharingTable)
      .where(eq(ficheActionSharingTable.ficheId, fiche.id));
    expectFailure(
      await resolveFiche(ficheUrl(fiche.id, autre.collectiviteId)),
      'FICHE_REFERENCE_UNAVAILABLE'
    );
  });

  test('refuse une résolution à un utilisateur en lecture seule', async () => {
    context = await createContext(CollectiviteRole.LECTURE);
    const fiche = await createFiche();
    const indicateur = await createIndicateur();
    expectFailure(
      await resolveFiche(ficheUrl(fiche.id)),
      'IMPORT_REFERENCE_UNAUTHORIZED'
    );
    expectFailure(
      await resolveIndicateur(indicateurUrl(indicateur.id)),
      'IMPORT_REFERENCE_UNAUTHORIZED'
    );
  });

  test('résout un indicateur personnalisé sans changer sa périodicité ni ses valeurs', async () => {
    const indicateur = await createIndicateur();
    const [valeur] = await db.db
      .insert(indicateurValeurTable)
      .values({
        collectiviteId: context.collectiviteId,
        indicateurId: indicateur.id,
        dateValeur: '2026-01-01',
        periodicite: 'mensuelle',
        resultat: 14,
        objectif: 20,
      })
      .returning();
    expect(await resolveIndicateur(indicateurUrl(indicateur.id))).toEqual({
      success: true,
      data: { indicateurId: indicateur.id },
    });
    expect(
      await db.db
        .select()
        .from(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, indicateur.id))
    ).toEqual([indicateur]);
    expect(
      await db.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.indicateurId, indicateur.id))
    ).toEqual([valeur]);
  });

  test('résout un code de catalogue depuis une URL sans reprendre les valeurs de sa collectivité source', async () => {
    const autre = await createContext();
    const indicateur = await createIndicateur({
      collectiviteId: null,
      identifiantReferentiel: `test-${randomUUID()}`,
    });
    await db.db.insert(indicateurValeurTable).values({
      collectiviteId: autre.collectiviteId,
      indicateurId: indicateur.id,
      dateValeur: '2026-01-01',
      periodicite: 'mensuelle',
      resultat: 999,
    });
    expect(
      await resolveIndicateur(
        `${appUrl}/collectivite/${autre.collectiviteId}/indicateurs/cae/${indicateur.identifiantReferentiel}`
      )
    ).toEqual({ success: true, data: { indicateurId: indicateur.id } });
    expect(
      await db.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.collectiviteId, context.collectiviteId))
    ).toEqual([]);
  });

  test('ne confond pas un identifiant de catalogue numérique avec un ID personnalisé', async () => {
    const indicateur = await createIndicateur();
    expectFailure(
      await resolveIndicateur(
        `${appUrl}/collectivite/${context.collectiviteId}/indicateurs/cae/${indicateur.id}`
      ),
      'INDICATEUR_REFERENCE_UNAVAILABLE'
    );
  });

  test('refuse un indicateur personnalisé appartenant à une autre collectivité', async () => {
    const autre = await createContext();
    const indicateur = await createIndicateur({
      collectiviteId: autre.collectiviteId,
    });
    expectFailure(
      await resolveIndicateur(
        indicateurUrl(indicateur.id, autre.collectiviteId)
      ),
      'INDICATEUR_REFERENCE_UNAVAILABLE'
    );
  });

  test('résout un indicateur de groupement seulement pour une collectivité membre', async () => {
    const [groupement] = await db.db
      .insert(groupementTable)
      .values({ nom: `Import ${randomUUID()}` })
      .returning();
    const indicateur = await createIndicateur({
      collectiviteId: null,
      groupementId: groupement.id,
      identifiantReferentiel: `test-${randomUUID()}`,
    });
    const url = `${appUrl}/collectivite/${context.collectiviteId}/indicateurs/selection/${indicateur.identifiantReferentiel}`;
    expectFailure(
      await resolveIndicateur(url),
      'INDICATEUR_REFERENCE_UNAVAILABLE'
    );
    await db.db.insert(groupementCollectiviteTable).values({
      groupementId: groupement.id,
      collectiviteId: context.collectiviteId,
    });
    expect(await resolveIndicateur(url)).toEqual({
      success: true,
      data: { indicateurId: indicateur.id },
    });
  });

  test('refuse une URL de mauvais type et une référence d’indicateur inconnue', async () => {
    const fiche = await createFiche();
    const indicateur = await createIndicateur();
    expectFailure(
      await resolveFiche(indicateurUrl(indicateur.id)),
      'INVALID_IMPORT_REFERENCE_URL'
    );
    expectFailure(
      await resolveIndicateur(ficheUrl(fiche.id)),
      'INVALID_IMPORT_REFERENCE_URL'
    );
    expectFailure(
      await resolveIndicateur(indicateurUrl(2147483647)),
      'INDICATEUR_REFERENCE_UNAVAILABLE'
    );
    expectFailure(
      await resolveIndicateur(
        `${appUrl}/collectivite/${
          context.collectiviteId
        }/indicateurs/perso/${randomUUID()}`
      ),
      'INVALID_IMPORT_REFERENCE_URL'
    );
  });
});
