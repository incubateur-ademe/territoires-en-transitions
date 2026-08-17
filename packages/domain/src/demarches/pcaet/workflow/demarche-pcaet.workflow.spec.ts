import { describe, expect, it } from 'vitest';
import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from '../demarche-pcaet-status.enum.schema';
import { DEMARCHE_PCAET_INITIAL_STATUS } from './demarche-pcaet-state';
import { demarchePcaetWorkflow } from './demarche-pcaet.workflow';
import { demarchePcaetTransitionValues } from './transitions/demarche-pcaet-transition.enum';
import { DEMARCHE_PCAET_TRANSITIONS } from './transitions/demarche-pcaet.transitions';

const DEFINITIONS = Object.values(DEMARCHE_PCAET_TRANSITIONS);

describe('définition du cycle de vie', () => {
  it('chaque transition déclare des statuts valides', () => {
    for (const def of DEFINITIONS) {
      expect(def.from.length).toBeGreaterThan(0);
      expect(def.from).not.toContain(def.to);
    }
  });

  it('le statut initial est l’élaboration', () => {
    expect(DEMARCHE_PCAET_INITIAL_STATUS).toBe(
      DemarchePcaetStatusEnum.EN_ELABORATION
    );
  });

  // Les noms de transitions sont déclarés une fois (l'enum, que l'API accepte) ;
  // ce test relie cette liste à la table qui les définit.
  it('chaque transition nommée est définie, et une seule fois', () => {
    expect([...demarchePcaetWorkflow.transitionNames].sort()).toEqual(
      [...demarchePcaetTransitionValues].sort()
    );
  });

  it('toute transition est réservée au pilote', () => {
    for (const def of DEFINITIONS) {
      expect(def.guards).toContain('estPilote');
    }
  });

  it('le cycle est linéaire, avec deux retours en arrière', () => {
    const chemin = (status: DemarchePcaetStatus) =>
      demarchePcaetWorkflow
        .getReachableTransitions(status)
        .map(
          (transition) =>
            `${transition} → ${
              demarchePcaetWorkflow.getTransitionDef(transition).to
            }`
        )
        .sort();

    expect(chemin('en_elaboration')).toEqual([
      'transmettre_pour_avis → transmis_pour_avis',
    ]);
    expect(chemin('transmis_pour_avis')).toEqual([
      'adopter → adopte',
      'reprendre_elaboration → en_elaboration',
    ]);
    expect(chemin('adopte')).toEqual(['publier → publie']);
    // On n'archive qu'un dossier publié ; dépublier revient à l'adoption.
    expect(chemin('publie')).toEqual([
      'archiver → archive',
      'depublier → adopte',
    ]);
    expect(chemin('archive')).toEqual([]);
  });
});
