import {
  DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
  evaluateTransitions,
  PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS,
  type DemarcheDocumentEtape,
  type DemarcheDocumentsSnapshot,
  type PcaetDiagnostic,
  type PcaetDiagnosticIndicateurParentConfig,
} from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import {
  getDemarchePcaetCompletion,
  getDiagnosticIndicateurTopicStatut,
  getDiagnosticVulnerabiliteTopicStatut,
} from './completion';
import type { DemarchePcaet } from './types';

/**
 * Modèle documentaire minimal : une section requise, substituable par le
 * document global. La règle de couverture elle-même est testée dans
 * `@tet/domain` (demarche-documents.rules.spec) — ici on vérifie seulement que
 * l'avancement du dossier s'y branche.
 */
const documentsSnapshot = (
  overrides: Partial<DemarcheDocumentsSnapshot> = {}
): DemarcheDocumentsSnapshot => ({
  config: DEMARCHE_DOCUMENTS_CONFIG_DEFAULT,
  definitions: [
    {
      id: 'document_global',
      nom: 'Document global du PCAET',
      description: '',
      requis: false,
      ordre: 0,
      etape: 'amont',
      substituts: [],
      substitutsDeclarables: [],
    },
    {
      id: 'diagnostic',
      nom: 'Diagnostic',
      description: '',
      requis: true,
      ordre: 1,
      etape: 'amont',
      substituts: ['document_global'],
      substitutsDeclarables: [],
    },
  ],
  documents: [],
  documentsAdditional: [],
  ...overrides,
});

/** Pièce aval requise (délibération d'adoption), à la façon du modèle PCAET. */
const deliberationDefinition = {
  id: 'deliberation_adoption',
  nom: "Délibération d'adoption du PCAET",
  description: '',
  requis: true,
  ordre: 10,
  etape: 'aval',
  substituts: [],
  substitutsDeclarables: [],
} satisfies DemarcheDocumentsSnapshot['definitions'][number];

const snapshotAvecDeliberation = (
  documents: DemarcheDocumentsSnapshot['documents'] = []
) =>
  documentsSnapshot({
    definitions: [...documentsSnapshot().definitions, deliberationDefinition],
    documents,
  });

const documentDepose = (
  documentId: string,
  etape: DemarcheDocumentEtape = 'amont'
) => ({
  id: 1,
  documentId,
  etape,
  commentaire: '',
  modifiedAt: '2026-08-05T00:00:00.000Z',
  modifiedBy: null,
  fichier: {
    id: 10,
    filename: `${documentId}.pdf`,
    hash: 'hash',
    bucketId: 'bucket',
    filesize: 1024,
  },
});

/** Une inclusion déclarée : ligne sans fichier, comme le dépôt la crée. */
const inclusionDeclaree = (documentId: string) => ({
  ...documentDepose(documentId),
  fichier: null,
});

/**
 * Dossier documentaire complet : le document global déposé, et l'inclusion du
 * diagnostic dedans — cochée au dépôt, donc lue en base et non déduite.
 */
const completeSnapshot = documentsSnapshot({
  documents: [
    documentDepose('document_global'),
    inclusionDeclaree('diagnostic'),
  ],
});

/**
 * Topics indicateurs tels que servis par l'API : config parent + valeurs.
 */
const parentConfig = (
  overrides: Partial<PcaetDiagnosticIndicateurParentConfig> = {}
): PcaetDiagnosticIndicateurParentConfig => ({
  code: 'emissions_ges',
  label: 'Émissions GES',
  icon: 'fire-line',
  indicateurDefinitionId: 'cae_1.a',
  referenceYearApplyLevel: 'parent',
  children: [
    {
      label: 'Résidentiel',
      indicateurDefinitionId: 'cae_1.c',
      optionalYears: [2050],
    },
  ],
  ...overrides,
});

const valeur = ({
  identifiant,
  year,
  resultat = null,
  objectif = null,
}: {
  identifiant: string;
  year: number;
  resultat?: number | null;
  objectif?: number | null;
}) =>
  ({
    indicateurValeur: {
      indicateurId: 1,
      dateValeur: `${year}-01-01`,
      resultat,
      objectif,
    },
    indicateurDefinition: { identifiantReferentiel: identifiant },
  }) as PcaetDiagnostic['indicateurValeurs'][number];

const valeursCompletes = (): PcaetDiagnostic['indicateurValeurs'] => [
  valeur({ identifiant: 'cae_1.c', year: 2021, resultat: 12 }),
  ...PCAET_DIAGNOSTIC_INDICATEURS_REQUIRED_OBJECTIF_YEARS.map((year) =>
    valeur({ identifiant: 'cae_1.c', year, objectif: 8 })
  ),
];

const topicVulnerabilite = (): PcaetDiagnostic['vulnerabilite'] => ({
  code: 'vulnerabilite_territoire',
  label: 'Vulnérabilité du territoire',
  icon: 'map-2-line',
  horizons: [2050, 2100],
  thematiques: [
    { id: 1, code: 'eau', label: 'Eau', requis: true, isSocle: true },
  ],
  lignes: [
    {
      thematiqueId: 1,
      niveauMaintenant: null,
      niveau2050: null,
      niveau2100: null,
      objectifs2050: null,
      objectifs2100: null,
    },
  ],
});

const completeDiagnostic = (
  overrides: Partial<PcaetDiagnostic> = {}
): PcaetDiagnostic => ({
  indicateurParentConfigs: [parentConfig()],
  indicateurDefinitions: [],
  indicateurValeurs: valeursCompletes(),
  vulnerabilite: topicVulnerabilite(),
  ...overrides,
});

const completeDemarche: DemarchePcaet = {
  id: 1,
  collectiviteId: 1,
  type: 'pcaet',
  titre: 'PCAET',
  description: 'Présentation du PCAET',
  statut: 'en_elaboration',
  obligation: 'obligatoire',
  dateCreation: '2026-01-01T00:00:00.000Z',
  dateModification: '2026-01-01T00:00:00.000Z',
  dateLancement: null,
  datePublication: null,
  dateTransmission: null,
  dateEcheanceAvis: null,
  transitions: evaluateTransitions('en_elaboration'),
  amontModifiable: true,
  avalModifiable: false,
  pilotes: [],
  planActionIds: [42],
};

describe('getDemarchePcaetCompletion', () => {
  it('marque tout complete quand chaque topic est rempli', () => {
    expect(
      getDemarchePcaetCompletion(
        completeDemarche,
        completeDiagnostic(),
        completeSnapshot
      )
    ).toEqual({
      diagnostic: 'complete',
      plan: 'complete',
      documents: 'complete',
      // Le modèle de test ne demande aucune pièce aval : pas de sous-étape
      // documents à l'adoption, et rien ne retient la publication.
      documentsAval: null,
    });
  });

  it("passe le diagnostic en incomplete dès qu'un horizon d'objectif requis manque", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeDiagnostic({
        indicateurValeurs: [
          valeur({ identifiant: 'cae_1.c', year: 2021, resultat: 12 }),
          valeur({ identifiant: 'cae_1.c', year: 2030, objectif: 8 }),
          valeur({ identifiant: 'cae_1.c', year: 2036, objectif: 6 }),
        ],
      }),
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('incomplete');
  });

  it("laisse le diagnostic incomplete tant que les topics ne sont pas chargés : on ne déclare pas complet ce qu'on n'a pas lu", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      null,
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('incomplete');
  });

  it('laisse le diagnostic complet même si la vulnérabilité du territoire est vide : rien n’y est exigé', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeDiagnostic({
        vulnerabilite: topicVulnerabilite(),
      }),
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('complete');
  });

  it("passe le plan en incomplete quand aucun plan d'action n'est associé", () => {
    const completion = getDemarchePcaetCompletion(
      { ...completeDemarche, planActionIds: [] },
      completeDiagnostic(),
      completeSnapshot
    );

    expect(completion.plan).toBe('incomplete');
  });

  it('marque les documents complete quand les inclusions du global sont cochées', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeDiagnostic(),
      completeSnapshot
    );

    expect(completion.documents).toBe('complete');
  });

  it("passe les documents en incomplete quand une pièce requise n'est pas couverte", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeDiagnostic(),
      documentsSnapshot()
    );

    expect(completion.documents).toBe('incomplete');
  });

  it('considère les documents incomplete tant que le dossier n’est pas chargé', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeDiagnostic()
    );

    expect(completion.documents).toBe('incomplete');
    // Sans dossier chargé, on ne préjuge pas non plus de l'aval.
    expect(completion.documentsAval).toBeNull();
  });

  it('suit la pièce aval requise indépendamment du dossier d’élaboration', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeDiagnostic(),
      snapshotAvecDeliberation([documentDepose('document_global')])
    );

    expect(completion.documentsAval).toBe('incomplete');
  });

  it('suit la couverture de la pièce aval requise', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeDiagnostic(),
      snapshotAvecDeliberation([
        documentDepose('document_global'),
        documentDepose('deliberation_adoption', 'aval'),
      ])
    );

    expect(completion.documentsAval).toBe('complete');
  });

  it('masque la sous-étape documents quand le modèle ne demande rien pour l’étape', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeDiagnostic(),
      documentsSnapshot({ definitions: [deliberationDefinition] })
    );

    // Aucune pièce amont demandée : la sous-étape est masquée.
    expect(completion.documents).toBeNull();
    expect(completion.documentsAval).toBe('incomplete');
  });
});

describe('getDiagnosticIndicateurTopicStatut', () => {
  it('annonce optionnel un topic marqué optional', () => {
    expect(
      getDiagnosticIndicateurTopicStatut(parentConfig({ optional: true }), [])
    ).toBe('optional');
  });

  it('reprend la saisie pour un topic à indicateurs', () => {
    expect(
      getDiagnosticIndicateurTopicStatut(parentConfig(), valeursCompletes())
    ).toBe('complete');
    expect(getDiagnosticIndicateurTopicStatut(parentConfig(), [])).toBe(
      'incomplete'
    );
  });
});

describe('getDiagnosticVulnerabiliteTopicStatut', () => {
  it('annonce toujours optionnel le topic vulnérabilité', () => {
    expect(getDiagnosticVulnerabiliteTopicStatut()).toBe('optional');
  });
});
