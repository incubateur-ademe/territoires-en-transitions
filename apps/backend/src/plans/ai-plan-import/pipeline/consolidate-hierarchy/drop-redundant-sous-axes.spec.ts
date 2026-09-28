import { describe, expect, it } from 'vitest';
import { ExtractedAction } from '../../models/extracted-action';
import { dropRedundantSousAxes } from './drop-redundant-sous-axes';

const anAction = (
  titre: string,
  sousAxe: string,
  axe = 'Axe I : Tous héros ordinaires'
): ExtractedAction => ({
  axe,
  sousAxe,
  titre,
  description: null,
  objectifs: null,
  structurePilote: null,
  directionServicePilote: null,
  personnePilote: null,
  budget: null,
  statut: null,
  confidence: null,
  sousActions: [],
});

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
});
