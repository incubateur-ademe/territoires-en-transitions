import { describe, expect, it } from 'vitest';
import { trajectoiresSnbcLabels } from './trajectoires-snbc.labels';

const { trajectoireSnbc3EvolutionSecteur } = trajectoiresSnbcLabels;

describe('trajectoireSnbc3EvolutionSecteur', () => {
  it("nomme l'indicateur tracé : consommations", () => {
    expect(
      trajectoireSnbc3EvolutionSecteur({
        indicateurId: 'consommations_finales',
        evolution2030: '-21 %',
        evolution2050: '-63 %',
      })
    ).toBe(
      "Pour votre territoire, la trajectoire SNBC 3 fait évoluer les consommations d'énergie de ce secteur de -21 % d'ici 2030 et de -63 % d'ici 2050, par rapport à 2021."
    );
  });

  it("nomme l'indicateur tracé : émissions, avec une seule échéance", () => {
    expect(
      trajectoireSnbc3EvolutionSecteur({
        indicateurId: 'emissions_ges',
        evolution2030: null,
        evolution2050: '-99 %',
      })
    ).toBe(
      "Pour votre territoire, la trajectoire SNBC 3 fait évoluer les émissions de GES de ce secteur de -99 % d'ici 2050, par rapport à 2021."
    );
  });
});
