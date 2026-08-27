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

  // Deux familles, et le nom dit laquelle : infinitif pour un acte de la
  // collectivité, participe passé pour un événement constaté par le système.
  it('seules les transitions système sont sans acteur', () => {
    const SANS_ACTEUR = ['avis_tous_rendus', 'delai_avis_echu'];

    for (const [nom, def] of Object.entries(DEMARCHE_PCAET_TRANSITIONS)) {
      if (SANS_ACTEUR.includes(nom)) {
        expect(def.guards).not.toContain('estPilote');
      } else {
        expect(def.guards).toContain('estPilote');
      }
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

    // L'élaboration n'a qu'une sortie, et rien n'y ramène.
    expect(chemin('en_elaboration')).toEqual([
      'transmettre_pour_avis → transmis_pour_avis',
    ]);
    // Deux chemins vers `instruit` : les avis rendus, ou le délai échu.
    expect(chemin('transmis_pour_avis')).toEqual([
      'avis_tous_rendus → instruit',
      'delai_avis_echu → instruit',
    ]);
    // L'instruction close ne se défait pas : pas de retour à l'élaboration.
    expect(chemin('instruit')).toEqual(['publier → publie']);
    // On n'archive qu'un dossier publié ; dépublier revient à la finalisation.
    expect(chemin('publie')).toEqual([
      'archiver → archive',
      'depublier → instruit',
    ]);
    expect(chemin('archive')).toEqual([]);
  });
});
