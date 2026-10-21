import { describe, expect, it } from 'vitest';
import {
  createEmptyExtractedAction,
  ExtractedAction,
  ExtractedSousAction,
  withAxisPath,
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

const anAction = (overrides: Partial<ExtractedAction>): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 1',
    sousAxe: '1.1',
    titre: 'Titre',
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
        partenaires: 'Région, ADEME',
        budget: 24000,
        financements: 'Fonds vert',
        moyensHumains: '0,5 ETP',
        statut: 'En cours',
        sousActions: [
          aSousAction('Déployer des lignes'),
          aSousAction('Autopartage'),
        ],
      }),
    ]);

    expect(text).toContain('Axe 4 Mobilité :');
    expect(text).toContain('Sous axe 4.2 Covoiturage :');
    expect(text).toContain('| 0 | 4.2.1 Réduire l autosolisme');
    expect(text).toContain('Développer le covoiturage');
    expect(text).toContain('Déployer des lignes; Autopartage');
    expect(text).toContain('Personne pilote Jean Dupont');
    expect(text).toContain('Partenaires Région, ADEME');
    expect(text).toContain('Budget 24000');
    expect(text).toContain('Financements Fonds vert');
    expect(text).toContain('Moyens humains 0,5 ETP');
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

  it('rend les niveaux sous l’axe comme un seul sous-axe', () => {
    const text = renderActionsText([
      withAxisPath(anAction({ titre: 'Cadastre solaire' }), [
        'Ambition 2',
        'Développer les EnR',
        'Appuyer le solaire',
      ]),
    ]);

    expect(text).toContain('Ambition 2 :');
    expect(text).toContain(
      'Sous axe Développer les EnR > Appuyer le solaire :'
    );
  });
});
