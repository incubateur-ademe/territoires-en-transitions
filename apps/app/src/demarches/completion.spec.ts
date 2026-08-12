import {
  DemarchePcaetTopicKindEnum,
  type DemarcheDocumentsSnapshot,
  type DemarchePcaetTopic,
} from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import {
  getDemarchePcaetCompletion,
  getDiagnosticTopicStatut,
  isVulnerabiliteComplete,
} from './completion';
import {
  defaultVulnerabiliteLigne,
  defaultVulnerabiliteState,
} from './pcaet/constants';
import type { DemarchePcaet, DemarchePcaetVulnerabiliteNiveau } from './types';

/**
 * Modèle documentaire minimal : une section requise, substituable par le
 * document global. La règle de couverture elle-même est testée dans
 * `@tet/domain` (pcaet-documents.rules.spec) — ici on vérifie seulement que
 * l'avancement du dossier s'y branche.
 */
const documentsSnapshot = (
  overrides: Partial<DemarcheDocumentsSnapshot> = {}
): DemarcheDocumentsSnapshot => ({
  definitions: [
    {
      id: 'document_global',
      nom: 'Document global du PCAET',
      description: '',
      requis: false,
      ordre: 0,
      portee: 'global',
      etape: 'amont',
      couverturePlateforme: null,
      substituts: [],
    },
    {
      id: 'diagnostic',
      nom: 'Diagnostic',
      description: '',
      requis: true,
      ordre: 1,
      portee: 'section',
      etape: 'amont',
      couverturePlateforme: null,
      substituts: ['document_global'],
    },
  ],
  documents: [],
  ...overrides,
});

const documentDepose = (documentId: string) => ({
  id: 1,
  documentId,
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

/** Dossier documentaire complet par le seul document global. */
const completeSnapshot = documentsSnapshot({
  documents: [documentDepose('document_global')],
});

/**
 * Topics tels que servis par l'API : le référentiel et les valeurs, que la règle
 * du domaine tranche. La vulnérabilité reste dérivée de la saisie locale pour
 * son badge, sans peser sur la transmission.
 */
const topicIndicateurs = (isComplete: boolean): DemarchePcaetTopic => ({
  code: 'profil_energie_climat',
  label: 'Profil énergie climat',
  icon: 'fire-line',
  kind: DemarchePcaetTopicKindEnum.INDICATEURS,
  groupLabel: 'Secteur',
  rowLabel: null,
  unit: 'kteq CO2',
  referentielId: 'cae_1.a',
  horizons: [2030],
  referenceYear: 2021,
  years: [2021, 2030],
  rows: [
    {
      label: 'Résidentiel',
      referentielId: 'cae_1.c',
      indicateurId: 1,
      requis: true,
      rows: [],
    },
  ],
  valeurs: isComplete
    ? [
        { indicateurId: 1, year: 2021, resultat: 12, objectif: null, references: [] },
        { indicateurId: 1, year: 2030, resultat: null, objectif: 8, references: [] },
      ]
    : [],
});

const topicVulnerabilite = (): DemarchePcaetTopic => ({
  ...topicIndicateurs(true),
  code: 'vulnerabilite_territoire',
  kind: DemarchePcaetTopicKindEnum.VULNERABILITE,
  groupLabel: null,
  unit: null,
  referentielId: null,
  referenceYear: null,
  years: [],
  rows: [],
  valeurs: [],
});

const completeTopics: DemarchePcaetTopic[] = [
  topicIndicateurs(true),
  topicIndicateurs(true),
  topicIndicateurs(true),
  topicIndicateurs(true),
  topicVulnerabilite(),
];

const completeDemarche: DemarchePcaet = {
  id: 1,
  collectiviteId: 1,
  type: 'pcaet',
  titre: 'PCAET',
  description: 'Présentation du PCAET',
  statutPublication: 'draft',
  statut: 'en_elaboration',
  obligation: 'obligatoire',
  dateCreation: '2026-01-01T00:00:00.000Z',
  dateModification: '2026-01-01T00:00:00.000Z',
  dateLancement: null,
  datePublication: null,
  dateTransmission: null,
  dateEcheanceAvis: null,
  availableTransitions: [],
  pilotes: [],
  planActionId: 42,
  vulnerabilite: {
    lignes: defaultVulnerabiliteState().lignes.map((ligne) => ({
      ...ligne,
      diagMaintenant: 'fort',
      diag2050: 'fort',
      diag2100: 'fort',
    })),
  },
  vulnerabiliteValideeLe: null,
};

describe('getDemarchePcaetCompletion', () => {
  it('marque tout complete et autorise la transmission quand chaque topic est rempli', () => {
    expect(
      getDemarchePcaetCompletion(
        completeDemarche,
        completeTopics,
        completeSnapshot
      )
    ).toEqual({
      description: 'complete',
      diagnostic: 'complete',
      plan: 'complete',
      documents: 'complete',
      canTransmettre: true,
    });
  });

  it('passe la description en incomplete quand elle ne contient que des espaces sans bloquer la transmission', () => {
    const completion = getDemarchePcaetCompletion(
      { ...completeDemarche, description: '   ' },
      completeTopics,
      completeSnapshot
    );

    expect(completion.description).toBe('incomplete');
    // La description rapide est optionnelle : elle ne bloque plus le dépôt.
    expect(completion.canTransmettre).toBe(true);
  });

  it("passe le diagnostic en incomplete des qu'un topic est incomplete", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      [
        ...completeTopics.slice(0, 3),
        topicIndicateurs(false),
        topicVulnerabilite(),
      ],
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it("laisse le diagnostic incomplete tant que les topics ne sont pas chargés : on ne déclare pas complet ce qu'on n'a pas lu", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      [],
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it('ne fait pas peser la vulnérabilité sur la transmission : le serveur ne la voit pas', () => {
    const vulnerabiliteIncomplete = {
      ...completeDemarche,
      vulnerabilite: {
        lignes: [
          {
            ...defaultVulnerabiliteLigne('agriculture'),
            diagMaintenant: 'fort' as const,
            diag2050: 'fort' as const,
            diag2100: 'non_renseigne' as const,
          },
        ],
      },
    };

    // Son badge reflète la saisie locale…
    expect(
      getDiagnosticTopicStatut(vulnerabiliteIncomplete, topicVulnerabilite())
    ).toBe('incomplete');

    // …mais la saisie vit en sessionStorage : le guard serveur ne peut pas la
    // juger, donc le front ne la compte pas non plus.
    const completion = getDemarchePcaetCompletion(
      vulnerabiliteIncomplete,
      completeTopics,
      completeSnapshot
    );
    expect(completion.diagnostic).toBe('complete');
    expect(completion.canTransmettre).toBe(true);
  });

  it("passe le plan en incomplete quand aucun plan d'action n'est associé", () => {
    const completion = getDemarchePcaetCompletion(
      { ...completeDemarche, planActionId: null },
      completeTopics,
      completeSnapshot
    );

    expect(completion.plan).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it('marque les documents complete dès que le document global est déposé', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeTopics,
      completeSnapshot
    );

    expect(completion.documents).toBe('complete');
    expect(completion.canTransmettre).toBe(true);
  });

  it("passe les documents en incomplete quand une pièce requise n'est pas couverte", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeTopics,
      documentsSnapshot()
    );

    expect(completion.documents).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it('considère les documents incomplete tant que le dossier n’est pas chargé', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeTopics
    );

    expect(completion.documents).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });
});

const ligneRenseignee = (
  domaineId: string,
  niveau: DemarchePcaetVulnerabiliteNiveau
) => ({
  ...defaultVulnerabiliteLigne(domaineId),
  diagMaintenant: niveau,
  diag2050: niveau,
  diag2100: niveau,
});

describe('isVulnerabiliteComplete', () => {
  it("reste incomplete tant qu'un seul domaine garde un horizon non renseigné", () => {
    const state = defaultVulnerabiliteState();
    state.lignes[0].diagMaintenant = 'fort';

    expect(isVulnerabiliteComplete(state)).toBe(false);
  });

  it('devient complete quand tous les horizons de tous les domaines sont renseignés', () => {
    const state = {
      lignes: defaultVulnerabiliteState().lignes.map((ligne) => ({
        ...ligne,
        diagMaintenant: 'moyen' as const,
        diag2050: 'moyen' as const,
        diag2100: 'moyen' as const,
      })),
    };

    expect(isVulnerabiliteComplete(state)).toBe(true);
  });

  it('reste incomplete quand un horizon futur reste non renseigné malgré un diagnostic maintenant saisi', () => {
    const state = {
      lignes: [
        {
          ...defaultVulnerabiliteLigne('agriculture'),
          diagMaintenant: 'fort' as const,
          diag2050: 'fort' as const,
          diag2100: 'non_renseigne' as const,
        },
      ],
    };

    expect(isVulnerabiliteComplete(state)).toBe(false);
  });

  it('compte "non concerné" comme un niveau renseigné valide', () => {
    const state = {
      lignes: [
        ligneRenseignee('agriculture', 'non_concerne'),
        ligneRenseignee('eau', 'fort'),
      ],
    };

    expect(isVulnerabiliteComplete(state)).toBe(true);
  });

  it("reste incomplete quand aucun domaine n'est saisi", () => {
    expect(isVulnerabiliteComplete({ lignes: [] })).toBe(false);
  });
});

describe('getDiagnosticTopicStatut', () => {
  it('dérive le topic vulnérabilité de la saisie locale et ignore le null du serveur', () => {
    const demarche = { ...completeDemarche, vulnerabilite: { lignes: [] } };

    expect(getDiagnosticTopicStatut(demarche, topicVulnerabilite())).toBe(
      'incomplete'
    );
  });

  it('reprend la complétude serveur pour un topic à indicateurs', () => {
    expect(
      getDiagnosticTopicStatut(completeDemarche, topicIndicateurs(true))
    ).toBe('complete');
    expect(
      getDiagnosticTopicStatut(completeDemarche, topicIndicateurs(false))
    ).toBe('incomplete');
  });
});
