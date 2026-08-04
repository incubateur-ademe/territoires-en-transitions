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

const completeDemarche: DemarchePcaet = {
  id: 'demarche-1',
  collectiviteId: 1,
  titre: 'PCAET',
  description: 'Présentation du PCAET',
  statutPublication: 'draft',
  statut: 'en_elaboration',
  obligation: 'obligatoire',
  dateCreation: '2026-01-01T00:00:00.000Z',
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
  documents: {
    globalDocument: null,
    sections: [
      {
        sectionId: 'diagnostic',
        statut: 'valide',
        file: { id: 'f1', name: 'diagnostic.pdf' },
        couvertSansFichier: false,
      },
      {
        sectionId: 'plan_actions',
        statut: 'pas_valide',
        file: null,
        couvertSansFichier: true,
      },
    ],
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
};

describe('getDemarchePcaetCompletion', () => {
  it('marque tout complete et autorise la publication quand chaque section est remplie', () => {
    expect(getDemarchePcaetCompletion(completeDemarche)).toEqual({
      description: 'complete',
      diagnostic: 'complete',
      plan: 'complete',
      documents: 'complete',
      canTransmettre: true,
    });
  });

  it('passe la description en incomplete quand elle ne contient que des espaces sans bloquer la publication', () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      description: '   ',
    });

    expect(completion.description).toBe('incomplete');
    // La description rapide est optionnelle : elle ne bloque plus la publication.
    expect(completion.canTransmettre).toBe(true);
  });

  it("passe le diagnostic en incomplete des qu'un volet est incomplete", () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      volets: { ...completeDemarche.volets, enr: 'incomplete' },
    });

    expect(completion.diagnostic).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it('recalcule le volet vulnérabilité depuis la saisie et ignore un statut stocké complete devenu faux', () => {
    const completion = getDemarchePcaetCompletion({
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
    });

    expect(completion.diagnostic).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it("passe le plan en incomplete quand aucun plan d'action n'est associé", () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      planActionId: null,
    });

    expect(completion.plan).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it("passe les documents en incomplete quand une section n'a ni fichier ni couverture alternative", () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      documents: {
        globalDocument: null,
        sections: [
          {
            sectionId: 'diagnostic',
            statut: 'pas_valide',
            file: null,
            couvertSansFichier: false,
          },
        ],
      },
    });

    expect(completion.documents).toBe('incomplete');
    expect(completion.canTransmettre).toBe(false);
  });

  it('marque les documents complete quand un document global est déposé même sans section couverte', () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      documents: {
        globalDocument: { id: 'global-1', name: 'pcaet-complet.pdf' },
        sections: [
          {
            sectionId: 'diagnostic',
            statut: 'pas_valide',
            file: null,
            couvertSansFichier: false,
          },
        ],
      },
    });

    expect(completion.documents).toBe('complete');
    expect(completion.canTransmettre).toBe(true);
  });

  it('marque les documents complete quand les 4 sections obligatoires sont couvertes même si les optionnelles sont vides', () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      documents: {
        globalDocument: null,
        sections: [
          {
            sectionId: 'diagnostic',
            statut: 'valide',
            file: { id: 'f1', name: 'diagnostic.pdf' },
            couvertSansFichier: false,
          },
          {
            sectionId: 'strategie_territoriale',
            statut: 'valide',
            file: { id: 'f2', name: 'strategie.pdf' },
            couvertSansFichier: false,
          },
          {
            sectionId: 'plan_actions',
            statut: 'pas_valide',
            file: null,
            couvertSansFichier: true,
          },
          {
            sectionId: 'dispositif_suivi_evaluation',
            statut: 'valide',
            file: { id: 'f3', name: 'suivi.pdf' },
            couvertSansFichier: false,
          },
          {
            sectionId: 'ees',
            statut: 'pas_valide',
            file: null,
            couvertSansFichier: false,
          },
          {
            sectionId: 'bilan_pcaet_precedent',
            statut: 'pas_valide',
            file: null,
            couvertSansFichier: false,
          },
        ],
      },
    });

    expect(completion.documents).toBe('complete');
    expect(completion.canTransmettre).toBe(true);
  });

  it('marque les documents incomplete quand une section obligatoire est vide même si des optionnelles sont remplies', () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      documents: {
        globalDocument: null,
        sections: [
          {
            sectionId: 'diagnostic',
            statut: 'valide',
            file: { id: 'f1', name: 'diagnostic.pdf' },
            couvertSansFichier: false,
          },
          {
            sectionId: 'dispositif_suivi_evaluation',
            statut: 'pas_valide',
            file: null,
            couvertSansFichier: false,
          },
          {
            sectionId: 'ees',
            statut: 'valide',
            file: { id: 'f2', name: 'ees.pdf' },
            couvertSansFichier: false,
          },
        ],
      },
    });

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
