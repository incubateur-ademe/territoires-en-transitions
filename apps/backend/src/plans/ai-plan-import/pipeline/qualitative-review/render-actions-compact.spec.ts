import { describe, expect, it } from 'vitest';
import {
  createEmptyExtractedAction,
  ExtractedAction,
  withAxisPath,
} from '../../models/extracted-action';
import { renderActionsCompact } from './render-actions-compact';

const toAction = (overrides: Partial<ExtractedAction>): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 1',
    sousAxe: '1.1',
    titre: '1.1.1 Action',
    ...overrides,
  });

describe('renderActionsCompact', () => {
  it('rend une ligne par action avec ses champs renseignés', () => {
    const rendu = renderActionsCompact([
      toAction({
        titre: "1.1.1 Réduire l'autosolisme",
        description: 'Développer le covoiturage',
        personnePilote: 'Jean Dupont',
      }),
    ]);

    expect(rendu).toBe(
      "1.1.1 Réduire l'autosolisme | Axe : Axe 1 | Sous-axe : 1.1 | " +
        'Description : Développer le covoiturage | Personne pilote : Jean Dupont'
    );
  });

  it('rend les niveaux sous l’axe comme un seul sous-axe', () => {
    const rendu = renderActionsCompact([
      withAxisPath(toAction({ titre: 'Cadastre solaire' }), [
        'Ambition 2',
        'Développer les EnR',
        'Appuyer le solaire',
      ]),
    ]);

    expect(rendu).toBe(
      'Cadastre solaire | Axe : Ambition 2 | ' +
        'Sous-axe : Développer les EnR > Appuyer le solaire'
    );
  });

  it("marque les sous-actions d'une ligne [SA] sous leur action parente", () => {
    const rendu = renderActionsCompact([
      toAction({
        sousActions: [
          {
            titre: 'Déployer des lignes de covoiturage',
            description: 'Avec aménagements',
            personnePilote: null,
            statut: 'En cours',
            dateDebut: '2025-01-01',
            dateFin: null,
          },
        ],
      }),
    ]);

    expect(rendu.split('\n')[1]).toBe(
      '[SA] Déployer des lignes de covoiturage | Description : Avec aménagements | ' +
        'Statut : En cours | Date de début : 2025-01-01'
    );
  });
});
