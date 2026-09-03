import { describe, expect, it } from 'vitest';
import { ExtractionAction } from './extract-actions.schema';
import { extractionResponseToExtractedActions } from './extraction-response-to-extracted-actions';

const anExtractionAction = (
  overrides: Partial<ExtractionAction> = {}
): ExtractionAction => ({
  axe: 'Axe 4 Mobilité',
  'sous-axe': '4.2 Covoiturage',
  titre: '4.2.1 Réduire l autosolisme',
  description: '',
  'sous-actions': [],
  objectifs: '',
  'structure pilote': '',
  'direction ou service pilote': '',
  'personne pilote': '',
  budget: '',
  statut: '',
  ...overrides,
});

describe('extractionResponseToExtractedActions', () => {
  it('mappe les clés françaises vers le modèle camelCase', () => {
    const [action] = extractionResponseToExtractedActions([
      anExtractionAction({
        description: 'Développer le covoiturage',
        objectifs: 'Rendre le covoiturage courant',
        'structure pilote': 'DDT',
        'direction ou service pilote': 'Service mobilité',
        'personne pilote': 'Jean Dupont',
        budget: '24000',
        statut: 'En cours',
      }),
    ]);

    expect(action).toEqual({
      axe: 'Axe 4 Mobilité',
      sousAxe: '4.2 Covoiturage',
      titre: '4.2.1 Réduire l autosolisme',
      description: 'Développer le covoiturage',
      objectifs: 'Rendre le covoiturage courant',
      structurePilote: 'DDT',
      directionServicePilote: 'Service mobilité',
      personnePilote: 'Jean Dupont',
      budget: 24000,
      statut: 'En cours',
      confidence: null,
      sousActions: [],
    });
  });

  it('convertit les chaînes vides en null et le budget en nombre', () => {
    const [action] = extractionResponseToExtractedActions([
      anExtractionAction({ budget: '  ', statut: '', description: '   ' }),
    ]);

    expect(action).toMatchObject({
      description: null,
      objectifs: null,
      structurePilote: null,
      personnePilote: null,
      budget: null,
      statut: null,
    });
  });

  it('met budget à null quand la valeur n est pas un entier', () => {
    const [action] = extractionResponseToExtractedActions([
      anExtractionAction({ budget: 'à définir' }),
    ]);

    expect(action.budget).toBeNull();
  });

  it('transforme les titres de sous-actions en sous-actions non enrichies', () => {
    const [action] = extractionResponseToExtractedActions([
      anExtractionAction({
        'sous-actions': ['Déployer des lignes', '  ', '  Autopartage  '],
      }),
    ]);

    expect(action.sousActions).toEqual([
      {
        titre: 'Déployer des lignes',
        description: null,
        personnePilote: null,
        statut: null,
        dateDebut: null,
        dateFin: null,
      },
      {
        titre: 'Autopartage',
        description: null,
        personnePilote: null,
        statut: null,
        dateDebut: null,
        dateFin: null,
      },
    ]);
  });
});
