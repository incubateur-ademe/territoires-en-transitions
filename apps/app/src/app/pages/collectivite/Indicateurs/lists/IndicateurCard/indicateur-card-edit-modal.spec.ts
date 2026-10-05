import { describe, expect, it } from 'vitest';
import { buildIndicateurCardUpdate } from './IndicateurCardEditModal';

const pilotes = [{ tagId: 12, nom: 'Camille' }];
const services = [{ id: 34, nom: 'Service environnement' }];
const thematiques = [{ id: 56, nom: 'Énergie' }];

describe('enregistrement depuis la carte indicateur', () => {
  it.each([{ thematiques: [] }, { thematiques }])(
    'omet les thématiques du catalogue lors de la mise à jour des pilotes et services d’un indicateur prédéfini ($thematiques)',
    ({ thematiques: catalogueThematiques }) => {
      expect(
        buildIndicateurCardUpdate(
          { estPerso: false },
          { pilotes, services, thematiques: catalogueThematiques }
        )
      ).toEqual({ pilotes, services });
    }
  );

  it('conserve les thématiques choisies pour un indicateur personnalisé', () => {
    expect(
      buildIndicateurCardUpdate(
        { estPerso: true },
        { pilotes, services, thematiques }
      )
    ).toEqual({ pilotes, services, thematiques });
  });

  it('envoie une liste vide pour retirer les thématiques d’un indicateur personnalisé', () => {
    expect(
      buildIndicateurCardUpdate(
        { estPerso: true },
        { pilotes, services, thematiques: [] }
      )
    ).toEqual({ pilotes, services, thematiques: [] });
  });
});
