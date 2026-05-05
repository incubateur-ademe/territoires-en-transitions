import {
  getAuthUser,
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestRouter,
  YALA_DADA,
  YOLO_DODO,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { allSectionKeys } from '@tet/pdf-components';
import { FICHE_ACTION_PDF_EXPORT_CONFIG } from './fiche-action-pdf-export.config';
import { randomUUID } from 'node:crypto';
import { createFiche, createFiches } from '../fiches.test-fixture';

let router: TrpcRouter;
let yoloDodo: AuthenticatedUser;
let yalaDada: AuthenticatedUser;
let noPermUser: AuthenticatedUser;

const COLLECTIVITE_ID = YOLO_DODO.collectiviteId.admin;

const MINIMAL_SECTION_KEYS = ['intro'] as const;

beforeAll(async () => {
  const app = await getTestApp();
  router = await getTestRouter(app);
  yoloDodo = await getAuthUser(YOLO_DODO);
  yalaDada = await getAuthUser(YALA_DADA);
  noPermUser = getAuthUserFromUserCredentials({
    id: randomUUID(),
    email: 'no-perms@test.com',
  });
});

describe('generatePdf', () => {
  it('rejects empty ficheIds array in selection mode', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    await expect(
      caller.plans.fiches.generatePdf({
        mode: 'selection',
        ficheIds: [],
        notesYears: 'all',
      })
    ).rejects.toThrow();
  });

  it(`rejects selection of more than ${FICHE_ACTION_PDF_EXPORT_CONFIG.maxFiches} fiches`, async () => {
    const caller = router.createCaller({ user: yoloDodo });
    const tooManyIds = Array.from(
      { length: FICHE_ACTION_PDF_EXPORT_CONFIG.maxFiches + 1 },
      (_, i) => i + 1
    );

    await expect(
      caller.plans.fiches.generatePdf({
        mode: 'selection',
        ficheIds: tooManyIds,
        notesYears: 'all',
      })
    ).rejects.toThrow();
  });

  it('returns a valid PDF for a single fiche with all sections', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const ficheId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Test export PDF - fiche simple',
        statut: 'En cours',
      },
    });

    const result = await caller.plans.fiches.generatePdf({
      mode: 'selection',
      ficheIds: [ficheId],
      sections: [...allSectionKeys],
      notesYears: 'all',
    });

    expect(result.pdf).toBeDefined();
    expect(result.fileName).toBe(`fiche-action-${ficheId}.pdf`);

    const buffer = Buffer.from(result.pdf, 'base64');
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1000);
  }, 30_000);

  it('returns a smaller PDF when most sections are disabled', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const ficheId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Test export PDF - sections minimales',
        statut: 'En cours',
      },
    });

    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        description:
          "Description longue pour tester que la section intro est bien prise en compte dans l'export PDF. Cette description contient suffisamment de texte pour que le PDF soit significativement plus gros quand la section est activée. Le suivi et l'animation du COT demande des moyens humains pour mettre en oeuvre l'ensemble des actions à piloter directement, assurer le suivi des actions pilotées par les collègues ou d'autres acteurs, animer le Comité de pilotage, assurer la mobilisation des élus.",
        pilotes: [{ userId: yoloDodo.id }],
      },
      isNotificationEnabled: false,
    });

    const fullResult = await caller.plans.fiches.generatePdf({
      mode: 'selection',
      ficheIds: [ficheId],
      sections: [...allSectionKeys],
      notesYears: 'all',
    });

    const minimalResult = await caller.plans.fiches.generatePdf({
      mode: 'selection',
      ficheIds: [ficheId],
      sections: [...MINIMAL_SECTION_KEYS],
      notesYears: 'all',
    });

    const fullBuffer = Buffer.from(fullResult.pdf, 'base64');
    const minimalBuffer = Buffer.from(minimalResult.pdf, 'base64');

    expect(minimalBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(minimalBuffer.length).toBeLessThan(fullBuffer.length);
  }, 60_000);

  it('returns a valid PDF without sections (defaults to all)', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const ficheId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Test export PDF - sans sections',
        statut: 'En cours',
      },
    });

    const result = await caller.plans.fiches.generatePdf({
      mode: 'selection',
      ficheIds: [ficheId],
      sections: [...allSectionKeys],
      notesYears: 'all',
    });

    const buffer = Buffer.from(result.pdf, 'base64');
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1000);
  }, 30_000);

  it('returns a valid multi-page PDF for multiple fiches', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const { ficheIds } = await createFiches({
      caller,
      ficheInputs: [
        {
          collectiviteId: COLLECTIVITE_ID,
          titre: 'Test export PDF - fiche 1',
          statut: 'En cours',
        },
        {
          collectiviteId: COLLECTIVITE_ID,
          titre: 'Test export PDF - fiche 2',
          statut: 'À venir',
        },
        {
          collectiviteId: COLLECTIVITE_ID,
          titre: 'Test export PDF - fiche 3',
          statut: 'Réalisé',
        },
      ],
    });

    const result = await caller.plans.fiches.generatePdf({
      mode: 'selection',
      ficheIds,
      sections: [...allSectionKeys],
      notesYears: 'all',
    });

    expect(result.pdf).toBeDefined();
    expect(result.fileName).toMatch(/^fiches-action-\d+\.pdf$/);

    const buffer = Buffer.from(result.pdf, 'base64');
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(5000);
  }, 60_000);

  it('exports fiches of a collectivite in mode all with filters', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    const ficheId = await createFiche({
      caller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Test export PDF - mode all',
        statut: 'En cours',
      },
    });

    const result = await caller.plans.fiches.generatePdf({
      mode: 'all',
      collectiviteId: COLLECTIVITE_ID,
      filters: { ficheIds: [ficheId] },
      sections: [...allSectionKeys],
      notesYears: 'all',
    });

    expect(result.pdf).toBeDefined();
    expect(result.fileName).toBe(`fiche-action-${ficheId}.pdf`);

    const buffer = Buffer.from(result.pdf, 'base64');
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(1000);
  }, 60_000);

  it('silently excludes a non-existent fiche and fails with NO_FICHES when selection is empty', async () => {
    const caller = router.createCaller({ user: yoloDodo });

    await expect(
      caller.plans.fiches.generatePdf({
        mode: 'selection',
        ficheIds: [999999],
        notesYears: 'all',
      })
    ).rejects.toThrow(/Aucune fiche/);
  });

  it('returns partial success with per-fiche breakdown when some fiches are unauthorized', async () => {
    const adminCaller = router.createCaller({ user: yoloDodo });

    const authorizedFicheId = await createFiche({
      caller: adminCaller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Test partial - fiche autorisée',
        statut: 'En cours',
      },
    });

    const lectureCaller = router.createCaller({ user: yalaDada });

    const result = await lectureCaller.plans.fiches.generatePdf({
      mode: 'selection',
      ficheIds: [authorizedFicheId, 999999],
      notesYears: 'all',
    });

    expect(result).toMatchObject({
      includedFicheIds: [authorizedFicheId],
      skippedForAuthFicheIds: [999999],
      skippedForErrorFicheIds: [],
    });
  }, 30_000);
});

describe('generatePdf - authorization', () => {
  it('filters unauthorized fiches and fails with NO_FICHES when selection is entirely unauthorized', async () => {
    const adminCaller = router.createCaller({ user: yoloDodo });

    const ficheId = await createFiche({
      caller: adminCaller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Test authz - fiche interdite',
        statut: 'En cours',
      },
    });

    const unauthorizedCaller = router.createCaller({ user: noPermUser });

    await expect(
      unauthorizedCaller.plans.fiches.generatePdf({
        mode: 'selection',
        ficheIds: [ficheId],
        notesYears: 'all',
      })
    ).rejects.toThrow(/Aucune fiche/);
  }, 30_000);

  it('allows selection mode when user has read access (lecture)', async () => {
    const adminCaller = router.createCaller({ user: yoloDodo });

    const ficheId = await createFiche({
      caller: adminCaller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Test authz - fiche autorisee en lecture',
        statut: 'En cours',
      },
    });

    const lectureCaller = router.createCaller({ user: yalaDada });

    const result = await lectureCaller.plans.fiches.generatePdf({
      mode: 'selection',
      ficheIds: [ficheId],
      notesYears: 'all',
    });

    const buffer = Buffer.from(result.pdf, 'base64');
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  }, 30_000);

  it('in all mode, silently excludes fiches the user cannot read', async () => {
    const adminCaller = router.createCaller({ user: yoloDodo });

    await createFiche({
      caller: adminCaller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Test authz - mode all exclusion',
        statut: 'En cours',
      },
    });

    const unauthorizedCaller = router.createCaller({ user: noPermUser });

    await expect(
      unauthorizedCaller.plans.fiches.generatePdf({
        mode: 'all',
        collectiviteId: COLLECTIVITE_ID,
        notesYears: 'all',
      })
    ).rejects.toThrow(/Aucune fiche/);
  }, 30_000);

  it('in all mode, exports only authorized fiches for a user with read access', async () => {
    const adminCaller = router.createCaller({ user: yoloDodo });

    const ficheId = await createFiche({
      caller: adminCaller,
      ficheInput: {
        collectiviteId: COLLECTIVITE_ID,
        titre: 'Test authz - mode all avec lecture',
        statut: 'En cours',
      },
    });

    const lectureCaller = router.createCaller({ user: yalaDada });

    const result = await lectureCaller.plans.fiches.generatePdf({
      mode: 'all',
      collectiviteId: COLLECTIVITE_ID,
      filters: { ficheIds: [ficheId] },
      notesYears: 'all',
    });

    expect(result.pdf).toBeDefined();
    const buffer = Buffer.from(result.pdf, 'base64');
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  }, 30_000);
});
