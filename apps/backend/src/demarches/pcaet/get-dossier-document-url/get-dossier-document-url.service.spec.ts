import type { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { success } from '@tet/backend/utils/result.type';
import type {
  DemarcheDocumentAdditional,
  DemarcheDocumentsSnapshot,
} from '@tet/domain/demarches';
import { describe, expect, it, vi } from 'vitest';
import { getDossierDocumentUrlInputSchema } from './get-dossier-document-url.input';
import { GetDossierDocumentUrlService } from './get-dossier-document-url.service';

const user = { id: 'instructeur' } as AuthenticatedUser;
const annexe = {
  id: 42,
  etape: 'amont',
  titre: '',
  commentaire: '',
  modifiedAt: '2026-11-19T00:00:00Z',
  modifiedBy: null,
  fichier: {
    id: 7,
    filename: 'annexe.pdf',
    hash: 'hash-annexe',
    bucketId: 'bucket-deposante',
    filesize: 1024,
  },
} satisfies DemarcheDocumentAdditional;

const diagnostic = {
  ...annexe,
  documentId: 'pcaet_diagnostic',
  fichier: {
    ...annexe.fichier,
    id: 8,
    filename: 'diagnostic.pdf',
    hash: 'hash-diagnostic',
  },
};

const buildService = (overrides: Partial<DemarcheDocumentsSnapshot> = {}) => {
  const snapshot: DemarcheDocumentsSnapshot = {
    config: {
      additionalAmont: true,
      additionalAval: true,
      formatsAutorises: ['pdf'],
      mimeTypesAutorises: ['application/pdf'],
    },
    definitions: [],
    documents: [diagnostic],
    documentsAdditional: [annexe],
    ...overrides,
  };
  const permissions = {
    canConsulterDossier: vi.fn().mockResolvedValue(
      success({
        demarcheId: 2,
        collectiviteId: 3,
        demandeAvisId: 1,
        instructeurCollectiviteId: 4,
        instructeurType: 'dreal',
        perimetre: 'principal',
      })
    ),
  };
  const repository = {
    loadSnapshot: vi.fn().mockResolvedValue(snapshot),
  };
  const documentStorage = {
    createSignedDownloadUrl: vi.fn(
      async ({ bucketId, key }: { bucketId: string; key: string }) =>
        success({ signedUrl: `https://storage.example/${bucketId}/${key}` })
    ),
  };
  const service = new GetDossierDocumentUrlService(
    permissions as never,
    repository as never,
    documentStorage as never,
    { trackDossierInstruction: vi.fn() } as never
  );
  return { service, documentStorage };
};

describe('GetDossierDocumentUrlService', () => {
  it.each([{ demandeAvisId: 1 }, { demarcheId: 2 }])(
    'télécharge une pièce additionnelle sans titre depuis le dossier %j',
    async (ref) => {
      const { service } = buildService();

      const result = await service.getDossierDocumentUrl(
        getDossierDocumentUrlInputSchema.parse({
          ...ref,
          documentAdditionalId: annexe.id,
        }),
        { user }
      );

      expect(result).toEqual(
        success({
          filename: 'annexe.pdf',
          url: 'https://storage.example/bucket-deposante/hash-annexe',
        })
      );
    }
  );

  it('refuse une pièce additionnelle absente du dossier autorisé', async () => {
    const { service, documentStorage } = buildService();

    const result = await service.getDossierDocumentUrl(
      getDossierDocumentUrlInputSchema.parse({
        demandeAvisId: 1,
        documentAdditionalId: 99,
      }),
      { user }
    );

    expect(result).toEqual({ success: false, error: 'DOCUMENT_NOT_FOUND' });
    expect(documentStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it.each([
    { raison: 'sans fichier', document: { ...annexe, fichier: null } },
    {
      raison: 'déposée après les avis',
      document: { ...annexe, etape: 'aval' as const },
    },
  ])('refuse une pièce additionnelle $raison', async ({ document }) => {
    const { service, documentStorage } = buildService({
      documentsAdditional: [document],
    });

    const result = await service.getDossierDocumentUrl(
      getDossierDocumentUrlInputSchema.parse({
        demandeAvisId: 1,
        documentAdditionalId: annexe.id,
      }),
      { user }
    );

    expect(result).toEqual({ success: false, error: 'DOCUMENT_NOT_FOUND' });
    expect(documentStorage.createSignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('télécharge la version transmise du catalogue même si une reprise existe', async () => {
    const { service } = buildService({
      documents: [
        {
          ...diagnostic,
          id: 43,
          etape: 'aval',
          fichier: {
            ...diagnostic.fichier,
            filename: 'diagnostic-revise.pdf',
            hash: 'hash-revise',
          },
        },
        diagnostic,
      ],
    });

    const result = await service.getDossierDocumentUrl(
      { demandeAvisId: 1, documentId: diagnostic.documentId },
      { user }
    );

    expect(result).toEqual(
      success({
        filename: 'diagnostic.pdf',
        url: 'https://storage.example/bucket-deposante/hash-diagnostic',
      })
    );
  });
});
