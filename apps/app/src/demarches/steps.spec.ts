import { describe, expect, it } from 'vitest';
import {
  flattenSteps,
  getStepsNavModel,
  makeDemarcheSectionUrl,
} from './steps';

const TOPIC_CODES = [
  'profil_energie_climat',
  'sequestration',
  'polluants_atmospheriques',
  'enr',
  'vulnerabilite_territoire',
] as const;

describe('flattenSteps', () => {
  it('déroule documents, un item par topic, puis plan', () => {
    const items = flattenSteps({
      etape: 'amont',
      hasDocuments: true,
      topicCodes: TOPIC_CODES,
    });

    expect(items).toEqual([
      { section: 'documents', topicCode: null },
      { section: 'diagnostic', topicCode: 'profil_energie_climat' },
      { section: 'diagnostic', topicCode: 'sequestration' },
      { section: 'diagnostic', topicCode: 'polluants_atmospheriques' },
      { section: 'diagnostic', topicCode: 'enr' },
      { section: 'diagnostic', topicCode: 'vulnerabilite_territoire' },
      { section: 'plan', topicCode: null },
    ]);
  });

  it('replie le diagnostic en un seul item quand les topics ne sont pas chargés', () => {
    expect(
      flattenSteps({ etape: 'amont', hasDocuments: true, topicCodes: [] })
    ).toEqual([
      { section: 'documents', topicCode: null },
      { section: 'diagnostic', topicCode: null },
      { section: 'plan', topicCode: null },
    ]);
  });

  it('omet la sous-étape documents quand le modèle ne demande aucune pièce amont', () => {
    const items = flattenSteps({
      etape: 'amont',
      hasDocuments: false,
      topicCodes: TOPIC_CODES,
    });

    expect(items[0]).toEqual({
      section: 'diagnostic',
      topicCode: 'profil_energie_climat',
    });
    expect(items).toHaveLength(TOPIC_CODES.length + 1);
  });
});

describe("flattenSteps à l'aval", () => {
  it('garde le diagnostic entier malgré les topics chargés', () => {
    expect(
      flattenSteps({
        etape: 'aval',
        hasDocuments: true,
        topicCodes: TOPIC_CODES,
      })
    ).toEqual([
      { section: 'documents', topicCode: null },
      { section: 'diagnostic', topicCode: null },
      { section: 'plan', topicCode: null },
    ]);
  });

  it("omet les documents quand le modèle n'en attend aucun à l'aval", () => {
    expect(
      flattenSteps({ etape: 'aval', hasDocuments: false, topicCodes: [] })
    ).toEqual([
      { section: 'diagnostic', topicCode: null },
      { section: 'plan', topicCode: null },
    ]);
  });
});

describe('getStepsNavModel', () => {
  const base = {
    etape: 'amont' as const,
    hasDocuments: true,
    topicCodes: TOPIC_CODES,
  };

  it('sur documents : pas de précédent, suivant = premier topic', () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'documents',
      currentTopicCode: null,
    });

    expect(nav.prev).toBeNull();
    expect(nav.next).toEqual({
      section: 'diagnostic',
      topicCode: 'profil_energie_climat',
    });
    expect(nav.isLastStep).toBe(false);
  });

  it('sur un topic médian : les voisins sont des topics', () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'diagnostic',
      currentTopicCode: 'polluants_atmospheriques',
    });

    expect(nav.prev).toEqual({
      section: 'diagnostic',
      topicCode: 'sequestration',
    });
    expect(nav.next).toEqual({ section: 'diagnostic', topicCode: 'enr' });
  });

  it('sur le premier topic : précédent = documents', () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'diagnostic',
      currentTopicCode: 'profil_energie_climat',
    });

    expect(nav.prev).toEqual({ section: 'documents', topicCode: null });
  });

  it('sur le dernier topic : suivant = plan', () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'diagnostic',
      currentTopicCode: 'vulnerabilite_territoire',
    });

    expect(nav.next).toEqual({ section: 'plan', topicCode: null });
    expect(nav.isLastStep).toBe(false);
  });

  it('sur le diagnostic sans ?topic= : se résout comme le premier topic', () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'diagnostic',
      currentTopicCode: null,
    });

    expect(nav.prev).toEqual({ section: 'documents', topicCode: null });
    expect(nav.next).toEqual({
      section: 'diagnostic',
      topicCode: 'sequestration',
    });
  });

  it('sur le diagnostic avec un ?topic= inconnu : se résout comme le premier topic', () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'diagnostic',
      currentTopicCode: 'topic_inconnu',
    });

    expect(nav.next).toEqual({
      section: 'diagnostic',
      topicCode: 'sequestration',
    });
  });

  it('sur plan : précédent = dernier topic, et c’est la dernière étape', () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'plan',
      currentTopicCode: null,
    });

    expect(nav.prev).toEqual({
      section: 'diagnostic',
      topicCode: 'vulnerabilite_territoire',
    });
    expect(nav.next).toBeNull();
    expect(nav.isLastStep).toBe(true);
  });

  it('sur plan avec topics non chargés : précédent = diagnostic sans topic', () => {
    const nav = getStepsNavModel({
      etape: 'amont',
      hasDocuments: true,
      topicCodes: [],
      activeSection: 'plan',
      currentTopicCode: null,
    });

    expect(nav.prev).toEqual({ section: 'diagnostic', topicCode: null });
  });

  it('sans sous-étape documents : pas de précédent sur le premier topic', () => {
    const nav = getStepsNavModel({
      etape: 'amont',
      hasDocuments: false,
      topicCodes: TOPIC_CODES,
      activeSection: 'diagnostic',
      currentTopicCode: 'profil_energie_climat',
    });

    expect(nav.prev).toBeNull();
  });
});

describe("getStepsNavModel à l'aval", () => {
  const base = {
    etape: 'aval' as const,
    hasDocuments: true,
    topicCodes: TOPIC_CODES,
  };

  it('enchaîne les trois rappels, sans passer par les topics', () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'diagnostic',
      currentTopicCode: null,
    });

    expect(nav.prev).toEqual({ section: 'documents', topicCode: null });
    expect(nav.next).toEqual({ section: 'plan', topicCode: null });
    expect(nav.isLastStep).toBe(false);
  });

  it("l'onglet ouvert ne déplace pas la position", () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'diagnostic',
      currentTopicCode: 'enr',
    });

    expect(nav.prev).toEqual({ section: 'documents', topicCode: null });
    expect(nav.next).toEqual({ section: 'plan', topicCode: null });
  });

  it('le plan reste la dernière étape : elle porte la validation finale', () => {
    const nav = getStepsNavModel({
      ...base,
      activeSection: 'plan',
      currentTopicCode: null,
    });

    expect(nav.prev).toEqual({ section: 'diagnostic', topicCode: null });
    expect(nav.next).toBeNull();
    expect(nav.isLastStep).toBe(true);
  });
});

describe('makeDemarcheSectionUrl', () => {
  const ids = { collectiviteId: 1, demarcheId: 42 };

  it('pointe vers les pages des trois sous-étapes', () => {
    expect(makeDemarcheSectionUrl('documents', ids)).toBe(
      '/collectivite/1/demarche-pcaet/42/documents'
    );
    expect(makeDemarcheSectionUrl('diagnostic', ids)).toBe(
      '/collectivite/1/demarche-pcaet/42/indicateurs'
    );
    expect(makeDemarcheSectionUrl('plan', ids)).toBe(
      '/collectivite/1/demarche-pcaet/42/plan'
    );
  });
});
