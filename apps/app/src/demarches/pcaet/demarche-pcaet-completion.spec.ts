import type { DemarcheDocumentsSnapshot } from '@tet/domain/demarches';
import { describe, expect, it } from 'vitest';
import {
  getDemarchePcaetCompletion,
  getDiagnosticVoletStatut,
  isVulnerabiliteComplete,
} from './demarche-pcaet-completion';
import {
  defaultVulnerabiliteLigne,
  defaultVulnerabiliteState,
} from './demarche-pcaet.constants';
import type {
  DemarchePcaet,
  DemarchePcaetVulnerabiliteNiveau,
} from './demarche-pcaet.types';

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
      couverturePlateforme: null,
      substituts: ['document_global'],
    },
  ],
  documents: [],
  couvertures: [],
  planActionRattache: true,
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

const completeDemarche: DemarchePcaet = {
  id: 1,
  collectiviteId: 1,
  titre: 'PCAET',
  description: 'Présentation du PCAET',
  statutPublication: 'draft',
  statut: 'en_elaboration',
  obligation: 'obligatoire',
  dateCreation: '2026-01-01T00:00:00.000Z',
  dateModification: '2026-01-01T00:00:00.000Z',
  dateLancement: null,
  datePublication: null,
  pilotes: [],
  planActionId: 42,
  volets: {
    sequestration: 'complete',
    enr: 'complete',
    profil_energie_climat: 'complete',
    polluants_atmospheriques: 'complete',
    vulnerabilite_territoire: 'complete',
  },
  vulnerabilite: {
    lignes: defaultVulnerabiliteState().lignes.map((ligne) => ({
      ...ligne,
      diagMaintenant: 'fort',
      diag2050: 'fort',
      diag2100: 'fort',
    })),
  },
  vulnerabiliteValideeLe: null,
  gridStates: {},
};

describe('getDemarchePcaetCompletion', () => {
  it('marque tout complete et autorise la transmission quand chaque volet est rempli', () => {
    expect(
      getDemarchePcaetCompletion(completeDemarche, completeSnapshot)
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
      completeSnapshot
    );

    expect(completion.description).toBe('incomplete');
    // La description rapide est optionnelle : elle ne bloque plus le dépôt.
    expect(completion.canTransmettre).toBe(true);
  });

  it("passe le diagnostic en incomplete des qu'un volet est incomplete", () => {
    const completion = getDemarchePcaetCompletion(
      {
        ...completeDemarche,
        volets: { ...completeDemarche.volets, enr: 'incomplete' },
      },
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it('recalcule le volet vulnérabilité depuis la saisie et ignore un statut stocké complete devenu faux', () => {
    const completion = getDemarchePcaetCompletion(
      {
        ...completeDemarche,
        volets: {
          ...completeDemarche.volets,
          vulnerabilite_territoire: 'complete',
        },
        vulnerabilite: {
          lignes: [
            {
              ...defaultVulnerabiliteLigne('agriculture'),
              diagMaintenant: 'fort',
              diag2050: 'fort',
              diag2100: 'non_renseigne',
            },
          ],
        },
      },
      completeSnapshot
    );

    expect(completion.diagnostic).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it("passe le plan en incomplete quand aucun plan d'action n'est associé", () => {
    const completion = getDemarchePcaetCompletion(
      { ...completeDemarche, planActionId: null },
      completeSnapshot
    );

    expect(completion.plan).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it('marque les documents complete dès que le document global est déposé', () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      completeSnapshot
    );

    expect(completion.documents).toBe('complete');
    expect(completion.canTransmettre).toBe(true);
  });

  it("passe les documents en incomplete quand une pièce requise n'est pas couverte", () => {
    const completion = getDemarchePcaetCompletion(
      completeDemarche,
      documentsSnapshot()
    );

    expect(completion.documents).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it('considère les documents incomplete tant que le dossier n’est pas chargé', () => {
    const completion = getDemarchePcaetCompletion(completeDemarche);

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

describe('getDiagnosticVoletStatut', () => {
  it('dérive le volet vulnérabilité depuis la saisie, pas depuis le statut stocké', () => {
    const demarche = {
      ...completeDemarche,
      volets: {
        ...completeDemarche.volets,
        vulnerabilite_territoire: 'complete' as const,
      },
      vulnerabilite: { lignes: [] },
    };

    expect(getDiagnosticVoletStatut(demarche, 'vulnerabilite_territoire')).toBe(
      'incomplete'
    );
  });

  it('lit le statut stocké pour les autres volets', () => {
    expect(getDiagnosticVoletStatut(completeDemarche, 'enr')).toBe('complete');
  });
});
