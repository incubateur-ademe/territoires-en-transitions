import { describe, expect, it } from 'vitest';
import {
  createUnenrichedSousAction,
  ExtractedAction,
} from '../../models/extracted-action';
import { applyEnrichments } from './apply-enrichments';
import { EnrichmentEntry } from './enrich-sous-actions.schema';
import { indexSousActions } from './index-sous-actions';

const anAction = (
  titre: string,
  sousActionTitres: string[]
): ExtractedAction => ({
  axe: 'Axe 1',
  sousAxe: '1.1',
  titre,
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: sousActionTitres.map(createUnenrichedSousAction),
});

const emptyEntry = (index: number): EnrichmentEntry => ({
  index,
  description: '',
  personne_pilote: '',
  statut: '',
  date_debut: '',
  date_fin: '',
});

describe('applyEnrichments', () => {
  it('enrichit en place la sous-action correspondant à son index global', () => {
    const actions = [
      anAction('Action A', ['a0', 'a1']),
      anAction('Action B', ['b0']),
    ];
    const indexed = indexSousActions(actions);
    const entries: EnrichmentEntry[] = [
      {
        index: 2,
        description: 'Pilotée par le service mobilité',
        personne_pilote: 'Jean Dupont',
        statut: 'En cours',
        date_debut: '01/02/2025',
        date_fin: '15/03/2025',
      },
    ];

    const [actionA, actionB] = applyEnrichments(actions, indexed, entries);

    expect(actionA.sousActions).toEqual([
      createUnenrichedSousAction('a0'),
      createUnenrichedSousAction('a1'),
    ]);
    expect(actionB.sousActions[0]).toEqual({
      titre: 'b0',
      description: 'Pilotée par le service mobilité',
      personnePilote: 'Jean Dupont',
      statut: 'En cours',
      dateDebut: '2025-02-01',
      dateFin: '2025-03-15',
    });
  });

  it('laisse à null les champs vides et les dates non parsables', () => {
    const actions = [anAction('Action A', ['a0'])];
    const indexed = indexSousActions(actions);
    const entries: EnrichmentEntry[] = [
      { ...emptyEntry(0), date_debut: '31/02/2025', date_fin: 'pas une date' },
    ];

    const [action] = applyEnrichments(actions, indexed, entries);

    expect(action.sousActions[0]).toEqual(createUnenrichedSousAction('a0'));
  });

  it('ne touche pas aux sous-actions sans entrée correspondante', () => {
    const actions = [anAction('Action A', ['a0', 'a1'])];
    const indexed = indexSousActions(actions);

    const [action] = applyEnrichments(actions, indexed, [
      { ...emptyEntry(1), description: 'Seule a1 enrichie' },
    ]);

    expect(action.sousActions[0]).toEqual(createUnenrichedSousAction('a0'));
    expect(action.sousActions[1].description).toBe('Seule a1 enrichie');
  });
});
