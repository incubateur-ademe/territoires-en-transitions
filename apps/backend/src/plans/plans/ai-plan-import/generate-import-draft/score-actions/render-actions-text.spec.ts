import { describe, expect, it } from 'vitest';
import {
  ExtractedAction,
  ExtractedSousAction,
} from '../../models/extracted-action';
import { renderActionsText } from './render-actions-text';

const aSousAction = (titre: string): ExtractedSousAction => ({
  titre,
  description: null,
  personnePilote: null,
  statut: null,
  dateDebut: null,
  dateFin: null,
});

const anAction = (overrides: Partial<ExtractedAction>): ExtractedAction => ({
  axe: 'Axe 1',
  sousAxe: '1.1',
  titre: 'Titre',
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: [],
  ...overrides,
});

describe('renderActionsText', () => {
  it('rend les en-têtes axe / sous-axe et les champs renseignés', () => {
    const text = renderActionsText([
      anAction({
        axe: 'Axe 4 Mobilité',
        sousAxe: '4.2 Covoiturage',
        titre: '4.2.1 Réduire l autosolisme',
        description: 'Développer le covoiturage',
        personnePilote: 'Jean Dupont',
        budget: 24000,
        statut: 'En cours',
        sousActions: [aSousAction('Déployer des lignes'), aSousAction('Autopartage')],
      }),
    ]);

    expect(text).toContain('Axe 4 Mobilité :');
    expect(text).toContain('Sous axe 4.2 Covoiturage :');
    expect(text).toContain('| 0 | 4.2.1 Réduire l autosolisme');
    expect(text).toContain('Développer le covoiturage');
    expect(text).toContain('Déployer des lignes; Autopartage');
    expect(text).toContain('Personne pilote Jean Dupont');
    expect(text).toContain('Budget 24000');
    expect(text).toContain('Statut En cours');
  });

  it('préserve l index d origine du tableau, pas la position triée', () => {
    const text = renderActionsText([
      anAction({ axe: 'Axe Z', titre: 'Action Z' }),
      anAction({ axe: 'Axe A', titre: 'Action A' }),
    ]);

    expect(text.indexOf('Axe A :')).toBeLessThan(text.indexOf('Axe Z :'));
    expect(text).toContain('| 1 | Action A');
    expect(text).toContain('| 0 | Action Z');
  });
});
