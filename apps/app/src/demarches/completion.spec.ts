import {
  DemarchePcaetTopicKindEnum,
  evaluateTransitions,
  type DemarcheDocumentsSnapshot,
  type DemarchePcaetTopic,
} from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import {
  getDemarchePcaetCompletion,
  getDiagnosticTopicStatut,
} from './completion';
import type { DemarchePcaet } from './types';

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

/** Pièce aval requise (délibération d'adoption), à la façon du modèle PCAET. */
const deliberationDefinition = {
  id: 'deliberation_adoption',
  nom: "Délibération d'adoption du PCAET",
  description: '',
  requis: true,
  ordre: 10,
  portee: 'section',
  etape: 'aval',
  couverturePlateforme: null,
  substituts: [],
} satisfies DemarcheDocumentsSnapshot['definitions'][number];

const snapshotAvecDeliberation = (
  documents: DemarcheDocumentsSnapshot['documents'] = []
) =>
  documentsSnapshot({
    definitions: [...documentsSnapshot().definitions, deliberationDefinition],
    documents,
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
 * Topics tels que servis par l'API : le référentiel et les valeurs, que la
 * règle du domaine tranche — vulnérabilité comprise.
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
  extraYears: [],
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
        {
          indicateurId: 1,
          year: 2021,
          resultat: 12,
          objectif: null,
          references: [],
        },
        {
          indicateurId: 1,
          year: 2030,
          resultat: null,
          objectif: 8,
          references: [],
        },
      ]
    : [],
  vulnerabilite: null,
});

const topicVulnerabilite = (isComplete: boolean): DemarchePcaetTopic => ({
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
  vulnerabilite: {
    thematiques: [
      { id: 1, code: 'eau', label: 'Eau', requis: true, isSocle: true },
    ],
    lignes: [
      {
        thematiqueId: 1,
        niveauMaintenant: isComplete ? 'non_concerne' : null,
        niveau2050: isComplete ? 'non_concerne' : null,
        niveau2100: isComplete ? 'non_concerne' : null,
        objectifs2050: null,
        objectifs2100: null,
      },
    ],
  },
});

const completeTopics: DemarchePcaetTopic[] = [
  topicIndicateurs(true),
  topicIndicateurs(true),
  topicIndicateurs(true),
  topicIndicateurs(true),
  topicVulnerabilite(true),
];

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
  planActionId: 42,
};

describe('getDemarchePcaetCompletion', () => {
  it('marque tout complete quand chaque topic est rempli', () => {
    expect(
      getDemarchePcaetCompletion(
        completeDemarche,
        completeTopics,
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

  it("passe le diagnostic en incomplete des qu'un topic est incomplete", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      [
        ...completeTopics.slice(0, 3),
        topicIndicateurs(false),
        topicVulnerabilite(true),
      ],
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('incomplete');
  });

  it("laisse le diagnostic incomplete tant que les topics ne sont pas chargés : on ne déclare pas complet ce qu'on n'a pas lu", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      [],
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('incomplete');
  });

  it('laisse le diagnostic complet même si la vulnérabilité du territoire est vide : rien n’y est exigé', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      [topicIndicateurs(true), topicVulnerabilite(false)],
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('complete');
  });

  it("passe le plan en incomplete quand aucun plan d'action n'est associé", () => {
    const completion = getDemarchePcaetCompletion(
      { ...completeDemarche, planActionId: null },
      completeTopics,
      completeSnapshot
    );

    expect(completion.plan).toBe('incomplete');
  });

  it('marque les documents complete dès que le document global est déposé', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeTopics,
      completeSnapshot
    );

    expect(completion.documents).toBe('complete');
  });

  it("passe les documents en incomplete quand une pièce requise n'est pas couverte", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeTopics,
      documentsSnapshot()
    );

    expect(completion.documents).toBe('incomplete');
  });

  it('considère les documents incomplete tant que le dossier n’est pas chargé', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeTopics
    );

    expect(completion.documents).toBe('incomplete');
    // Sans dossier chargé, on ne préjuge pas non plus de l'aval.
    expect(completion.documentsAval).toBeNull();
  });

  it('suit la pièce aval requise indépendamment du dossier d’élaboration', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeTopics,
      snapshotAvecDeliberation([documentDepose('document_global')])
    );

    expect(completion.documentsAval).toBe('incomplete');
  });

  it('suit la couverture de la pièce aval requise', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeTopics,
      snapshotAvecDeliberation([
        documentDepose('document_global'),
        documentDepose('deliberation_adoption'),
      ])
    );

    expect(completion.documentsAval).toBe('complete');
  });

  it('masque la sous-étape documents quand le modèle ne demande rien pour l’étape', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeTopics,
      documentsSnapshot({ definitions: [deliberationDefinition] })
    );

    // Aucune pièce amont demandée : la sous-étape est masquée.
    expect(completion.documents).toBeNull();
    expect(completion.documentsAval).toBe('incomplete');
  });
});

describe('getDiagnosticTopicStatut', () => {
  it('ne donne aucun statut au topic vulnérabilité : pas de badge sur un volet sans exigence', () => {
    expect(getDiagnosticTopicStatut(topicVulnerabilite(true))).toBeNull();
    expect(getDiagnosticTopicStatut(topicVulnerabilite(false))).toBeNull();
  });

  it('reprend la complétude serveur pour un topic à indicateurs', () => {
    expect(getDiagnosticTopicStatut(topicIndicateurs(true))).toBe('complete');
    expect(getDiagnosticTopicStatut(topicIndicateurs(false))).toBe(
      'incomplete'
    );
  });
});
