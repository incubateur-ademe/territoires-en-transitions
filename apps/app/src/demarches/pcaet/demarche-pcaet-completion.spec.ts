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

  it('passe la description en incomplete quand elle ne contient que des espaces', () => {
    const completion = getDemarchePcaetCompletion({
      ...completeDemarche,
      description: '   ',
    });

    expect(completion.description).toBe('incomplete');
    expect(completion.canPublish).toBe(false);
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
});
