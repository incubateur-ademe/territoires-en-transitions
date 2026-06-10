import { FicheWithRelations } from '@tet/domain/plans';
import { describe, expect, it } from 'vitest';
import {
  AxeIdRemapping,
  mapSourceFicheToDuplicate,
} from './duplicated-fiche.mapper';

const createSourceFiche = (
  overrides: Partial<FicheWithRelations> = {}
): FicheWithRelations =>
  ({
    id: 1,
    collectiviteId: 10,
    parentId: null,
    titre: 'Action source',
    description: 'Description source',
    piliersEci: null,
    objectifs: 'Objectifs source',
    cibles: null,
    ressources: 'Moyens source',
    financements: 'Financements source',
    budgetPrevisionnel: '12000',
    statut: 'En cours',
    priorite: 'Élevé',
    dateDebut: '2026-01-01T00:00:00.000Z',
    dateFin: '2026-12-31T00:00:00.000Z',
    ameliorationContinue: true,
    participationCitoyenne: 'Concertation',
    participationCitoyenneType: 'information',
    tempsDeMiseEnOeuvre: null,
    majTermine: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    createdBy: null,
    modifiedAt: '2026-01-01T00:00:00.000Z',
    modifiedBy: null,
    restreint: false,
    collectiviteNom: null,
    partenaires: null,
    pilotes: null,
    referents: null,
    libreTags: null,
    instanceGouvernance: null,
    financeurs: null,
    sousThematiques: null,
    thematiques: null,
    structures: null,
    sharedWithCollectivites: null,
    indicateurs: null,
    services: null,
    effetsAttendus: null,
    axes: null,
    plans: null,
    etapes: null,
    notes: null,
    mesures: null,
    fichesLiees: null,
    docs: null,
    budgets: null,
    actionImpactId: null,
    completion: { ficheId: 1, fields: [], isCompleted: false },
    ...overrides,
  } as FicheWithRelations);

const emptyRemapping: AxeIdRemapping = new Map();

describe('mapSourceFicheToDuplicate', () => {
  it('recopie les colonnes de contenu et de suivi', () => {
    const source = createSourceFiche();

    const { fiche } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping: emptyRemapping,
    });

    expect(fiche).toMatchObject({
      collectiviteId: 99,
      parentId: null,
      titre: 'Action source',
      description: 'Description source',
      objectifs: 'Objectifs source',
      ressources: 'Moyens source',
      financements: 'Financements source',
      budgetPrevisionnel: '12000',
      statut: 'En cours',
      priorite: 'Élevé',
      dateDebut: '2026-01-01T00:00:00.000Z',
      dateFin: '2026-12-31T00:00:00.000Z',
      ameliorationContinue: true,
      participationCitoyenne: 'Concertation',
      majTermine: true,
      restreint: false,
    });
  });

  it('préserve le flag restreint à true', () => {
    const source = createSourceFiche({ restreint: true });

    const { fiche } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping: emptyRemapping,
    });

    expect(fiche.restreint).toBe(true);
  });

  it('place le parentId fourni sur la fiche', () => {
    const source = createSourceFiche();

    const { fiche } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: 555,
      axeIdRemapping: emptyRemapping,
    });

    expect(fiche.parentId).toBe(555);
  });

  it('remappe les appartenances aux axes vers les nouveaux ids', () => {
    const source = createSourceFiche({
      axes: [
        { id: 1, nom: 'A', collectiviteId: 10, parentId: null, planId: 1 },
        { id: 2, nom: 'B', collectiviteId: 10, parentId: 1, planId: 1 },
      ],
    });
    const axeIdRemapping: AxeIdRemapping = new Map([
      [1, 101],
      [2, 102],
    ]);

    const { ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping,
    });

    expect(ficheFields.axes).toEqual([{ id: 101 }, { id: 102 }]);
  });

  it('ignore les axes absents du remapping (appartenance à un autre plan)', () => {
    const source = createSourceFiche({
      axes: [
        { id: 1, nom: 'A', collectiviteId: 10, parentId: null, planId: 1 },
        { id: 9, nom: 'Autre', collectiviteId: 10, parentId: null, planId: 7 },
      ],
    });
    const axeIdRemapping: AxeIdRemapping = new Map([[1, 101]]);

    const { ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping,
    });

    expect(ficheFields.axes).toEqual([{ id: 101 }]);
  });

  it('extrait les ids des relations de catégorisation', () => {
    const source = createSourceFiche({
      thematiques: [{ id: 1, nom: 'T1' }],
      sousThematiques: [{ id: 2, nom: 'ST2', thematiqueId: 1 }],
      effetsAttendus: [{ id: 3, nom: 'E3', notice: null }],
      mesures: [{ id: 'eci_1.1', identifiant: '1.1', nom: 'M', referentiel: 'eci' }],
      indicateurs: [{ id: 4, nom: 'I4', unite: 'kg' }],
      libreTags: [{ id: 5, nom: 'Tag' }],
    });

    const { ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping: emptyRemapping,
    });

    expect(ficheFields.thematiques).toEqual([{ id: 1 }]);
    expect(ficheFields.sousThematiques).toEqual([{ id: 2 }]);
    expect(ficheFields.effetsAttendus).toEqual([{ id: 3 }]);
    expect(ficheFields.mesures).toEqual([{ id: 'eci_1.1' }]);
    expect(ficheFields.indicateurs).toEqual([{ id: 4 }]);
    expect(ficheFields.libreTags).toEqual([{ id: 5 }]);
  });

  it('convertit pilotes et référents au format tag/user', () => {
    const source = createSourceFiche({
      pilotes: [{ nom: 'P', tagId: 11, userId: null }],
      referents: [{ nom: 'R', tagId: null, userId: 'user-1' }],
    });

    const { ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping: emptyRemapping,
    });

    expect(ficheFields.pilotes).toEqual([{ tagId: 11, userId: null }]);
    expect(ficheFields.referents).toEqual([{ tagId: null, userId: 'user-1' }]);
  });

  it('convertit les financeurs au format attendu avec montant', () => {
    const source = createSourceFiche({
      financeurs: [
        {
          ficheId: 1,
          montantTtc: 5000,
          financeurTagId: 42,
          financeurTag: { id: 42, nom: 'Financeur', collectiviteId: 10 },
        },
      ],
    });

    const { ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping: emptyRemapping,
    });

    expect(ficheFields.financeurs).toEqual([
      { financeurTag: { id: 42 }, montantTtc: 5000 },
    ]);
  });

  it('mappe tempsDeMiseEnOeuvre et actionImpactId', () => {
    const source = createSourceFiche({
      tempsDeMiseEnOeuvre: { id: 3, nom: 'Court' },
      actionImpactId: 77,
    });

    const { ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping: emptyRemapping,
    });

    expect(ficheFields.tempsDeMiseEnOeuvre).toEqual({ id: 3 });
    expect(ficheFields.actionsImpact).toEqual([{ id: 77 }]);
  });

  it("n'expose ni fiches liées ni partage", () => {
    const source = createSourceFiche();

    const { ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping: emptyRemapping,
    });

    expect('fichesLiees' in ficheFields).toBe(false);
    expect('sharedWithCollectivites' in ficheFields).toBe(false);
  });

  it('recopie les notes (date et contenu) sans leur id', () => {
    const source = createSourceFiche({
      notes: [
        {
          id: 1,
          dateNote: '2024-01-15',
          note: 'Note A',
          createdAt: '2024-01-15T00:00:00.000Z',
          modifiedAt: '2024-01-15T00:00:00.000Z',
          createdBy: null,
          modifiedBy: null,
        },
        {
          id: 2,
          dateNote: '2024-06-20',
          note: 'Note B',
          createdAt: '2024-06-20T00:00:00.000Z',
          modifiedAt: '2024-06-20T00:00:00.000Z',
          createdBy: null,
          modifiedBy: null,
        },
      ],
    });

    const { ficheFields } = mapSourceFicheToDuplicate({
      source,
      collectiviteId: 99,
      parentId: null,
      axeIdRemapping: emptyRemapping,
    });

    expect(ficheFields.notes).toEqual([
      { dateNote: '2024-01-15', note: 'Note A' },
      { dateNote: '2024-06-20', note: 'Note B' },
    ]);
  });
});
