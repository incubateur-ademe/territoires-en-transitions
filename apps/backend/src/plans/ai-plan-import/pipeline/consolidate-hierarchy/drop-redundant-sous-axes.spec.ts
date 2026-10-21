import { describe, expect, it } from 'vitest';
import {
  createEmptyExtractedAction,
  ExtractedAction,
  withAxisPath,
} from '../../models/extracted-action';
import { dropRedundantSousAxes } from './drop-redundant-sous-axes';

const anAction = (
  titre: string,
  sousAxe: string,
  axe = 'Axe I : Tous héros ordinaires'
): ExtractedAction => createEmptyExtractedAction({ axe, sousAxe, titre });

describe('dropRedundantSousAxes', () => {
  it("retire un sous-axe qui ne contient que l'action du même titre", () => {
    const actions = dropRedundantSousAxes([
      anAction(
        '1 ANCRER L’ADMINISTRATION DANS L’ECO-RESPONSABILITE',
        '1 Ancrer l’administration dans l’écoresponsabilité'
      ),
    ]);

    expect(actions[0].sousAxe).toBe('');
  });

  it('garde un sous-axe qui regroupe plusieurs actions', () => {
    const actions = dropRedundantSousAxes([
      anAction('Rénover les écoles', '1.1 Rénover les écoles'),
      anAction('Isoler la mairie', '1.1 Rénover les écoles'),
    ]);

    expect(actions.map((a) => a.sousAxe)).toEqual([
      '1.1 Rénover les écoles',
      '1.1 Rénover les écoles',
    ]);
  });

  it("garde un sous-axe d'une seule action quand son titre dit autre chose", () => {
    const actions = dropRedundantSousAxes([
      anAction('Développer le covoiturage', '4.2 Des déplacements plus sobres'),
    ]);

    expect(actions[0].sousAxe).toBe('4.2 Des déplacements plus sobres');
  });

  describe('sur un chemin de plusieurs niveaux', () => {
    const onPath = (titre: string, ...path: string[]): ExtractedAction =>
      withAxisPath(createEmptyExtractedAction({ titre }), path);

    it('retire le dernier niveau quand il ne contient que la fiche de même titre', () => {
      const actions = dropRedundantSousAxes([
        onPath(
          'Créer une plateforme de rénovation',
          'Ambition 1',
          'Rénover le bâti',
          'Créer une plateforme de rénovation'
        ),
        onPath(
          'Isoler les écoles',
          'Ambition 1',
          'Rénover le bâti',
          'Rénover les bâtiments publics'
        ),
      ]);

      expect(actions.map(({ cheminAxes }) => cheminAxes)).toEqual([
        ['Ambition 1', 'Rénover le bâti'],
        ['Ambition 1', 'Rénover le bâti', 'Rénover les bâtiments publics'],
      ]);
      expect(actions[0]).toMatchObject({
        axe: 'Ambition 1',
        sousAxe: 'Rénover le bâti',
      });
    });

    it('garde un dernier niveau partagé par plusieurs fiches', () => {
      const actions = dropRedundantSousAxes([
        onPath('Isoler les écoles', 'Ambition 1', 'Bâti', 'Isoler les écoles'),
        onPath('Isoler la mairie', 'Ambition 1', 'Bâti', 'Isoler les écoles'),
      ]);

      expect(actions.map(({ cheminAxes }) => cheminAxes?.length)).toEqual([
        3, 3,
      ]);
    });

    it('garde un niveau qui porte aussi des niveaux inférieurs', () => {
      const actions = dropRedundantSousAxes([
        onPath('Rénover le bâti', 'Ambition 1', 'Rénover le bâti'),
        onPath(
          'Isoler les écoles',
          'Ambition 1',
          'Rénover le bâti',
          'Bâtiments publics'
        ),
      ]);

      expect(actions[0].cheminAxes).toEqual(['Ambition 1', 'Rénover le bâti']);
    });

    it('ne retire jamais le premier niveau', () => {
      const actions = dropRedundantSousAxes([
        onPath('Rénover le bâti', 'Rénover le bâti'),
      ]);

      expect(actions[0].cheminAxes).toEqual(['Rénover le bâti']);
    });
  });
});
