import { describe, expect, it } from 'vitest';
import { getDemarchePcaetCompletion } from './demarche-pcaet-completion';
import type { DemarchePcaet } from './demarche-pcaet.types';

const completeDemarche: DemarchePcaet = {
  id: 'demarche-1',
  collectiviteId: 1,
  titre: 'PCAET',
  description: 'Présentation du PCAET',
  statutPublication: 'brouillon',
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
};

describe('getDemarchePcaetCompletion', () => {
  it('marque tout complete et autorise la publication quand chaque section est remplie', () => {
    expect(getDemarchePcaetCompletion(completeDemarche)).toEqual({
      description: 'complete',
      diagnostic: 'complete',
      plan: 'complete',
      documents: 'complete',
      canPublish: true,
    });
  });

  it('passe la description en incomplete quand elle ne contient que des espaces sans bloquer la publication', () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      description: '   ',
    });

    expect(completion.description).toBe('incomplete');
    // La description rapide est optionnelle : elle ne bloque plus la publication.
    expect(completion.canPublish).toBe(true);
  });

  it("passe le diagnostic en incomplete des qu'un volet est incomplete", () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      volets: { ...completeDemarche.volets, enr: 'incomplete' },
    });

    expect(completion.diagnostic).toBe('incomplete');
    expect(completion.canPublish).toBe(false);
  });

  it("passe le plan en incomplete quand aucun plan d'action n'est associé", () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      planActionId: null,
    });

    expect(completion.plan).toBe('incomplete');
    expect(completion.canPublish).toBe(false);
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
    expect(completion.canPublish).toBe(false);
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
    expect(completion.canPublish).toBe(true);
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
    expect(completion.canPublish).toBe(true);
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
    expect(completion.canPublish).toBe(false);
  });
});
