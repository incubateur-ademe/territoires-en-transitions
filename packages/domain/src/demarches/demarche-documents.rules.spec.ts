import { describe, expect, it } from 'vitest';
import type {
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentsSnapshot,
} from './demarche-document.schema';
import { DEMARCHE_DOCUMENTS_CONFIG_DEFAULT } from './demarche-definition.schema';
import {
  computeDemarcheDocumentsCoverage,
  findDemarcheDocumentSubstitutDepose,
  hasDemarcheDocumentsForEtape,
  isDemarcheDocumentFileAccepted,
  isDemarcheDocumentsAvalComplet,
  isDemarcheDocumentsAdditionalAutorise,
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
  etape: 'amont',
  substituts: [],
  substitutsDeclarables: [],
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
const couvertParLaPlateforme = (
  documentId: string
): DemarcheDocumentDepose => ({
  ...depose(documentId),
  fichier: null,
});

/**
 * Modèle de démarche minimal : un global qui couvre d'office les sections, et un
 * dispositif de suivi qui se déclare compris dans le programme d'actions —
 * le modèle PCAET en réduction.
 */
const snapshot = (
  overrides: Partial<DemarcheDocumentsSnapshot> = {}
): DemarcheDocumentsSnapshot => ({
  config: DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
  definitions: [
    definition({ id: GLOBAL_ID, ordre: 0 }),
    definition({
      id: 'diagnostic',
      requis: true,
      ordre: 1,
      substituts: [GLOBAL_ID],
    }),
    definition({
      id: 'plan_actions',
      requis: true,
      ordre: 2,
      substituts: [GLOBAL_ID],
    }),
    definition({
      id: 'dispositif_suivi_evaluation',
      requis: true,
      ordre: 3,
      substituts: [GLOBAL_ID],
      substitutsDeclarables: ['plan_actions'],
    }),
    definition({ id: 'ees', requis: false, ordre: 4, substituts: [GLOBAL_ID] }),
  ],
  documents: [],
  documentsAdditional: [],
  ...overrides,
});

/**
 * Modèle où une pièce requise n'est pas couverte d'office par le global : son
 * inclusion se déclare, à la façon de l'étude d'impact du PCAET.
 */
const snapshotInclusionDeclarable = (
  documents: DemarcheDocumentDepose[] = []
): DemarcheDocumentsSnapshot => ({
  ...snapshot({ documents }),
  definitions: [
    definition({ id: GLOBAL_ID, ordre: 0 }),
    definition({
      id: 'etude_impact',
      requis: true,
      ordre: 1,
      substitutsDeclarables: [GLOBAL_ID],
    }),
  ],
});

const coverageOf = (
  snapshotToCompute: DemarcheDocumentsSnapshot,
  documentId: string
) =>
  computeDemarcheDocumentsCoverage(snapshotToCompute).find(
    (entry) => entry.documentId === documentId
  );

describe('inclusion déclarée dans une autre pièce', () => {
  it('ne couvre pas la pièce sur le seul dépôt du document qui pourrait la contenir', () => {
    const coverage = coverageOf(
      snapshotInclusionDeclarable([depose(GLOBAL_ID)]),
      'etude_impact'
    );

    expect(coverage).toEqual({
      documentId: 'etude_impact',
      couvert: false,
      origine: null,
      substitutId: null,
    });
  });

  it('couvre la pièce quand la collectivité déclare l’inclusion et que le document est déposé', () => {
    const coverage = coverageOf(
      snapshotInclusionDeclarable([
        depose(GLOBAL_ID),
        couvertParLaPlateforme('etude_impact'),
      ]),
      'etude_impact'
    );

    expect(coverage).toEqual({
      documentId: 'etude_impact',
      couvert: true,
      origine: 'substitut',
      substitutId: GLOBAL_ID,
    });
  });

  it('ne couvre rien tant que le document qui accueille l’inclusion n’est pas déposé', () => {
    const coverage = coverageOf(
      snapshotInclusionDeclarable([couvertParLaPlateforme('etude_impact')]),
      'etude_impact'
    );

    expect(coverage?.couvert).toBe(false);
  });

  it('fait retomber la couverture au retrait du document qui l’accueillait', () => {
    const declaree = couvertParLaPlateforme('etude_impact');

    expect(
      coverageOf(
        snapshotInclusionDeclarable([depose(GLOBAL_ID), declaree]),
        'etude_impact'
      )?.couvert
    ).toBe(true);
    expect(
      coverageOf(snapshotInclusionDeclarable([declaree]), 'etude_impact')
        ?.couvert
    ).toBe(false);
  });

  it('pèse sur la complétude du dossier comme n’importe quelle couverture', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshotInclusionDeclarable([depose(GLOBAL_ID)])
      )
    ).toBe(false);
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshotInclusionDeclarable([
          depose(GLOBAL_ID),
          couvertParLaPlateforme('etude_impact'),
        ])
      )
    ).toBe(true);
  });
});

describe('findDemarcheDocumentSubstitutDepose', () => {
  const etudeImpact = definition({
    id: 'etude_impact',
    substitutsDeclarables: [GLOBAL_ID],
  });

  it('désigne le document déposé dans lequel la pièce peut être déclarée comprise', () => {
    expect(
      findDemarcheDocumentSubstitutDepose(etudeImpact, [depose(GLOBAL_ID)])
    ).toBe(GLOBAL_ID);
  });

  it('ne désigne rien tant que ce document n’est pas déposé', () => {
    expect(findDemarcheDocumentSubstitutDepose(etudeImpact, [])).toBeNull();
    expect(
      findDemarcheDocumentSubstitutDepose(etudeImpact, [
        couvertParLaPlateforme(GLOBAL_ID),
      ])
    ).toBeNull();
  });

  it('désigne aussi le document que le catalogue coche d’office : la case est la même', () => {
    expect(
      findDemarcheDocumentSubstitutDepose(
        definition({ id: 'diagnostic', substituts: [GLOBAL_ID] }),
        [depose(GLOBAL_ID)]
      )
    ).toBe(GLOBAL_ID);
  });
});

describe('computeDemarcheDocumentsCoverage', () => {
  it('ne couvre rien sur un dossier vide', () => {
    const coverage = computeDemarcheDocumentsCoverage(snapshot());

    expect(coverage.every(({ couvert }) => couvert === false)).toBe(true);
    expect(coverage.every(({ origine }) => origine === null)).toBe(true);
  });

  it('couvre les sections dont l’inclusion est déclarée, le document global déposé', () => {
    // Le dépôt coche les cases (cf. `listDefaultInclusions`, appliqué côté
    // serveur) : ici on part de l'état qui en résulte.
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({
        documents: [
          depose(GLOBAL_ID),
          couvertParLaPlateforme('diagnostic'),
          couvertParLaPlateforme('plan_actions'),
          couvertParLaPlateforme('dispositif_suivi_evaluation'),
          couvertParLaPlateforme('ees'),
        ],
      })
    );

    expect(coverage).toEqual([
      {
        documentId: GLOBAL_ID,
        couvert: true,
        origine: 'fichier',
        substitutId: null,
      },
      {
        documentId: 'diagnostic',
        couvert: true,
        origine: 'substitut',
        substitutId: GLOBAL_ID,
      },
      {
        documentId: 'plan_actions',
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
      {
        documentId: 'ees',
        couvert: true,
        origine: 'substitut',
        substitutId: GLOBAL_ID,
      },
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

  it('couvre une section déclarée comprise dans le programme d’actions déposé', () => {
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({
        documents: [
          depose('plan_actions'),
          couvertParLaPlateforme('dispositif_suivi_evaluation'),
        ],
      })
    );

    expect(
      coverage.find((c) => c.documentId === 'dispositif_suivi_evaluation')
    ).toEqual({
      documentId: 'dispositif_suivi_evaluation',
      couvert: true,
      origine: 'substitut',
      substitutId: 'plan_actions',
    });
  });

  it('ne couvre pas une pièce dont le modèle ne prévoit aucune inclusion', () => {
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
  it('n’est pas complet sur le seul dépôt du document global : les inclusions se lisent', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({ documents: [depose(GLOBAL_ID)] })
      )
    ).toBe(false);

    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          documents: [
            depose(GLOBAL_ID),
            couvertParLaPlateforme('diagnostic'),
            couvertParLaPlateforme('plan_actions'),
            couvertParLaPlateforme('dispositif_suivi_evaluation'),
          ],
        })
      )
    ).toBe(true);
  });

  it('redevient incomplet quand une inclusion est décochée', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          documents: [
            depose(GLOBAL_ID),
            couvertParLaPlateforme('diagnostic'),
            couvertParLaPlateforme('plan_actions'),
          ],
        })
      )
    ).toBe(false);
  });

  it('est complet quand chaque section requise est couverte à sa façon', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          documents: [
            depose('diagnostic'),
            depose('plan_actions'),
            couvertParLaPlateforme('dispositif_suivi_evaluation'),
          ],
        })
      )
    ).toBe(true);
  });

  it('est incomplet s’il manque une section requise', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({ documents: [depose('diagnostic')] })
      )
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
    expect(
      isDemarcheDossierDocumentsComplet(snapshot({ definitions: [] }))
    ).toBe(false);
  });

  it('ne considère pas le document global comme une pièce requise', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          definitions: [
            definition({
              id: GLOBAL_ID,
              requis: true,
              ordre: 0,
            }),
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
      definition({ id: GLOBAL_ID, ordre: 0 }),
      definition({ id: 'diagnostic', requis: true, ordre: 1 }),
      definition({
        id: 'deliberation_adoption',
        requis: true,
        ordre: 2,
        etape: 'aval',
      }),
    ];

    expect(
      hasDemarcheDocumentsForEtape(snapshot({ definitions }), 'amont')
    ).toBe(true);
    expect(
      hasDemarcheDocumentsForEtape(snapshot({ definitions }), 'aval')
    ).toBe(true);
  });

  it('ne compte pas le document global comme une pièce demandée', () => {
    const definitions = [
      definition({ id: GLOBAL_ID, ordre: 0 }),
      definition({ id: 'diagnostic', requis: true, ordre: 1 }),
    ];

    expect(
      hasDemarcheDocumentsForEtape(snapshot({ definitions }), 'aval')
    ).toBe(false);
  });

  it('compte une étape sans pièce attendue mais ouverte au dépôt de pièces additionnelles', () => {
    const sansPieceAval = snapshot({
      definitions: [definition({ id: 'diagnostic', requis: true, ordre: 1 })],
      config: { ...DEMARCHE_DOCUMENTS_CONFIG_DEFAULT, additionalAval: true },
    });

    expect(hasDemarcheDocumentsForEtape(sansPieceAval, 'aval')).toBe(true);
  });
});

describe('isDemarcheDocumentsAdditionalAutorise', () => {
  it('lit l’autorisation de l’étape demandée', () => {
    const config = {
      ...DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
      additionalAmont: true,
      additionalAval: false,
    };

    expect(isDemarcheDocumentsAdditionalAutorise(config, 'amont')).toBe(true);
    expect(isDemarcheDocumentsAdditionalAutorise(config, 'aval')).toBe(false);
  });
});

describe('isDemarcheDocumentFileAccepted', () => {
  /** Configuration du dossier PCAET : PDF uniquement. */
  const pdfSeul = {
    ...DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
    formatsAutorises: ['pdf'],
    mimeTypesAutorises: ['application/pdf'],
  };

  it('accepte tout quand le type de démarche ne restreint rien', () => {
    expect(
      isDemarcheDocumentFileAccepted(
        { filename: 'notes.docx', mimeType: 'application/zip' },
        DEMARCHE_DOCUMENTS_CONFIG_DEFAULT
      )
    ).toBe(true);
    // Une liste vide ne restreint pas davantage qu'une liste absente.
    expect(
      isDemarcheDocumentFileAccepted(
        { filename: 'notes.docx' },
        { ...DEMARCHE_DOCUMENTS_CONFIG_DEFAULT, formatsAutorises: [] }
      )
    ).toBe(true);
  });

  it('accepte un PDF', () => {
    expect(
      isDemarcheDocumentFileAccepted(
        { filename: 'pcaet.pdf', mimeType: 'application/pdf' },
        pdfSeul
      )
    ).toBe(true);
  });

  it('accepte un PDF dont le mime type est inconnu du stockage', () => {
    expect(
      isDemarcheDocumentFileAccepted({ filename: 'pcaet.PDF' }, pdfSeul)
    ).toBe(true);
    expect(
      isDemarcheDocumentFileAccepted(
        { filename: 'pcaet.pdf', mimeType: null },
        pdfSeul
      )
    ).toBe(true);
  });

  it('accepte un PDF quand seule l’extension est restreinte', () => {
    expect(
      isDemarcheDocumentFileAccepted(
        { filename: 'pcaet.pdf', mimeType: 'application/zip' },
        { ...pdfSeul, mimeTypesAutorises: null }
      )
    ).toBe(true);
  });

  it('vérifie le mime type quand seul lui est restreint', () => {
    // Une restriction n'annule pas l'autre : sans liste d'extensions, la liste
    // de mime types s'applique quand même.
    const mimeSeul = { ...pdfSeul, formatsAutorises: null };

    expect(
      isDemarcheDocumentFileAccepted(
        { filename: 'pcaet.bin', mimeType: 'application/pdf' },
        mimeSeul
      )
    ).toBe(true);
    expect(
      isDemarcheDocumentFileAccepted(
        { filename: 'pcaet.pdf', mimeType: 'application/zip' },
        mimeSeul
      )
    ).toBe(false);
  });

  it('refuse une autre extension', () => {
    expect(
      isDemarcheDocumentFileAccepted(
        { filename: 'pcaet.docx', mimeType: 'application/pdf' },
        pdfSeul
      )
    ).toBe(false);
    expect(isDemarcheDocumentFileAccepted({ filename: 'pcaet' }, pdfSeul)).toBe(
      false
    );
  });

  it('refuse un nom sans véritable extension', () => {
    // Un nom qui EST « pdf » n'a pas d'extension pdf.
    expect(isDemarcheDocumentFileAccepted({ filename: 'pdf' }, pdfSeul)).toBe(
      false
    );
    expect(isDemarcheDocumentFileAccepted({ filename: '.pdf' }, pdfSeul)).toBe(
      false
    );
    expect(
      isDemarcheDocumentFileAccepted({ filename: 'pcaet.' }, pdfSeul)
    ).toBe(false);
    expect(isDemarcheDocumentFileAccepted({ filename: '' }, pdfSeul)).toBe(
      false
    );
    // Un point dans le nom ne perturbe pas la lecture de l'extension.
    expect(
      isDemarcheDocumentFileAccepted({ filename: 'pcaet.v2.pdf' }, pdfSeul)
    ).toBe(true);
  });

  it('refuse un mime type incohérent avec l’extension', () => {
    expect(
      isDemarcheDocumentFileAccepted(
        { filename: 'pcaet.pdf', mimeType: 'application/zip' },
        pdfSeul
      )
    ).toBe(false);
  });
});
