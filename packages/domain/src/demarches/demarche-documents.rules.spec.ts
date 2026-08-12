import { describe, expect, it } from 'vitest';
import type {
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentsSnapshot,
} from './demarche-document.schema';
import {
  computeDemarcheDocumentsCoverage,
  hasDemarcheDocumentsForEtape,
  isDemarcheDocumentsAvalComplet,
  isDemarcheDossierDocumentsComplet,
} from './demarche-documents.rules';

const GLOBAL_ID = 'document_global';

const definition = (
  overrides: Partial<DemarcheDocumentDefinition> & { id: string }
): DemarcheDocumentDefinition => ({
  nom: overrides.id,
  description: '',
  requis: false,
  ordre: 0,
  portee: 'section',
  etape: 'amont',
  couverturePlateforme: null,
  substituts: [],
  ...overrides,
});

const depose = (documentId: string): DemarcheDocumentDepose => ({
  id: 1,
  documentId,
  commentaire: '',
  modifiedAt: '2026-08-05T00:00:00Z',
  modifiedBy: null,
  fichier: {
    id: 10,
    filename: `${documentId}.pdf`,
    hash: 'hash',
    bucketId: 'bucket',
    filesize: 1024,
  },
});

/** Pièce déclarée couverte par la plateforme : une ligne sans fichier. */
const couvertParLaPlateforme = (documentId: string): DemarcheDocumentDepose => ({
  ...depose(documentId),
  fichier: null,
});

/** Modèle de démarche minimal : un global qui substitue deux sections requises. */
const snapshot = (
  overrides: Partial<DemarcheDocumentsSnapshot> = {}
): DemarcheDocumentsSnapshot => ({
  definitions: [
    definition({ id: GLOBAL_ID, portee: 'global', ordre: 0 }),
    definition({ id: 'diagnostic', requis: true, ordre: 1, substituts: [GLOBAL_ID] }),
    definition({
      id: 'dispositif_suivi_evaluation',
      requis: true,
      ordre: 2,
      couverturePlateforme: 'plan_actions',
      substituts: [GLOBAL_ID],
    }),
    definition({ id: 'ees', requis: false, ordre: 3, substituts: [GLOBAL_ID] }),
  ],
  documents: [],
  ...overrides,
});

describe('computeDemarcheDocumentsCoverage', () => {
  it('ne couvre rien sur un dossier vide', () => {
    const coverage = computeDemarcheDocumentsCoverage(snapshot());

    expect(coverage.every(({ couvert }) => couvert === false)).toBe(true);
    expect(coverage.every(({ origine }) => origine === null)).toBe(true);
  });

  it('couvre toutes les sections substituables dès que le document global est déposé', () => {
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({ documents: [depose(GLOBAL_ID)] })
    );

    expect(coverage).toEqual([
      { documentId: GLOBAL_ID, couvert: true, origine: 'fichier', substitutId: null },
      {
        documentId: 'diagnostic',
        couvert: true,
        origine: 'substitut',
        substitutId: GLOBAL_ID,
      },
      {
        documentId: 'dispositif_suivi_evaluation',
        couvert: true,
        origine: 'substitut',
        substitutId: GLOBAL_ID,
      },
      { documentId: 'ees', couvert: true, origine: 'substitut', substitutId: GLOBAL_ID },
    ]);
  });

  it('fait primer un dépôt spécifique sur la substitution', () => {
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({ documents: [depose(GLOBAL_ID), depose('diagnostic')] })
    );

    expect(coverage.find((c) => c.documentId === 'diagnostic')).toEqual({
      documentId: 'diagnostic',
      couvert: true,
      origine: 'fichier',
      substitutId: null,
    });
  });

  it('couvre une section déclarée comprise dans le plan d’actions', () => {
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({
        documents: [couvertParLaPlateforme('dispositif_suivi_evaluation')],
      })
    );

    expect(
      coverage.find((c) => c.documentId === 'dispositif_suivi_evaluation')
    ).toEqual({
      documentId: 'dispositif_suivi_evaluation',
      couvert: true,
      origine: 'plan_actions',
      substitutId: null,
    });
  });

  it('ne couvre pas une pièce dont le modèle ne prévoit pas de couverture plateforme', () => {
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({ documents: [couvertParLaPlateforme('diagnostic')] })
    );

    expect(coverage.find((c) => c.documentId === 'diagnostic')).toEqual({
      documentId: 'diagnostic',
      couvert: false,
      origine: null,
      substitutId: null,
    });
  });
});

describe('isDemarcheDossierDocumentsComplet', () => {
  it('est complet avec le seul document global', () => {
    expect(
      isDemarcheDossierDocumentsComplet(snapshot({ documents: [depose(GLOBAL_ID)] }))
    ).toBe(true);
  });

  it('est complet quand chaque section requise est couverte à sa façon', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          documents: [
            depose('diagnostic'),
            couvertParLaPlateforme('dispositif_suivi_evaluation'),
          ],
          })
      )
    ).toBe(true);
  });

  it('est incomplet s’il manque une section requise', () => {
    expect(
      isDemarcheDossierDocumentsComplet(snapshot({ documents: [depose('diagnostic')] }))
    ).toBe(false);
  });

  it('est incomplet si une pièce requise est couverte sans que le modèle l’autorise', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          documents: [
            couvertParLaPlateforme('diagnostic'),
            couvertParLaPlateforme('dispositif_suivi_evaluation'),
          ],
        })
      )
    ).toBe(false);
  });

  it('ignore les sections optionnelles', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          definitions: [
            definition({ id: 'diagnostic', requis: true, ordre: 1 }),
            definition({ id: 'ees', requis: false, ordre: 2 }),
          ],
          documents: [depose('diagnostic')],
        })
      )
    ).toBe(true);
  });

  it('est incomplet si le modèle ne définit aucune section requise', () => {
    expect(isDemarcheDossierDocumentsComplet(snapshot({ definitions: [] }))).toBe(false);
  });

  it('ne considère pas le document global comme une pièce requise', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          definitions: [
            definition({ id: GLOBAL_ID, portee: 'global', requis: true, ordre: 0 }),
          ],
        })
      )
    ).toBe(false);
  });

  it('ignore les pièces aval : le dossier d’élaboration reste complet sans elles', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          definitions: [
            definition({ id: 'diagnostic', requis: true, ordre: 1 }),
            definition({
              id: 'deliberation_adoption',
              requis: true,
              ordre: 2,
              etape: 'aval',
            }),
          ],
          documents: [depose('diagnostic')],
        })
      )
    ).toBe(true);
  });
});

describe('isDemarcheDocumentsAvalComplet', () => {
  const avecDeliberation = (documents: DemarcheDocumentDepose[] = []) =>
    snapshot({
      definitions: [
        definition({ id: 'diagnostic', requis: true, ordre: 1 }),
        definition({
          id: 'deliberation_adoption',
          requis: true,
          ordre: 2,
          etape: 'aval',
        }),
      ],
      documents,
    });

  it('est complet quand le modèle ne demande aucune pièce aval', () => {
    expect(isDemarcheDocumentsAvalComplet(snapshot())).toBe(true);
  });

  it('est incomplet tant que la pièce aval requise n’est pas couverte', () => {
    expect(isDemarcheDocumentsAvalComplet(avecDeliberation())).toBe(false);
  });

  it('est complet dès que la pièce aval requise est déposée', () => {
    expect(
      isDemarcheDocumentsAvalComplet(
        avecDeliberation([depose('deliberation_adoption')])
      )
    ).toBe(true);
  });

  it('ignore les pièces aval optionnelles et l’amont incomplet', () => {
    expect(
      isDemarcheDocumentsAvalComplet(
        snapshot({
          definitions: [
            definition({ id: 'diagnostic', requis: true, ordre: 1 }),
            definition({
              id: 'memoire_reponse',
              requis: false,
              ordre: 2,
              etape: 'aval',
            }),
          ],
          documents: [],
        })
      )
    ).toBe(true);
  });
});

describe('hasDemarcheDocumentsForEtape', () => {
  it('détecte les pièces de portée section demandées pour une étape', () => {
    const definitions = [
      definition({ id: GLOBAL_ID, portee: 'global', ordre: 0 }),
      definition({ id: 'diagnostic', requis: true, ordre: 1 }),
      definition({
        id: 'deliberation_adoption',
        requis: true,
        ordre: 2,
        etape: 'aval',
      }),
    ];

    expect(hasDemarcheDocumentsForEtape(definitions, 'amont')).toBe(true);
    expect(hasDemarcheDocumentsForEtape(definitions, 'aval')).toBe(true);
  });

  it('ne compte pas le document global comme une pièce demandée', () => {
    const definitions = [
      definition({ id: GLOBAL_ID, portee: 'global', ordre: 0 }),
      definition({ id: 'diagnostic', requis: true, ordre: 1 }),
    ];

    expect(hasDemarcheDocumentsForEtape(definitions, 'aval')).toBe(false);
  });
});
