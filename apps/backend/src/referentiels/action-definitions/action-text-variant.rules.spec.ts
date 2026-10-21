import {
  CollectivitePopulationTypeEnum,
  CollectiviteTypeEnum,
  IdentiteCollectivite,
} from '@tet/domain/collectivites';
import {
  buildTemplateIdentite,
  buildTextVariantKey,
  getTextVariantKey,
  listTemplateVariants,
  parseTextVariantKey,
  TEMPLATE_REFERENCE_VARIANT,
  TEMPLATE_RENDER_VERSION,
} from './action-text-variant.rules';

function identite(
  overrides: Partial<IdentiteCollectivite>
): IdentiteCollectivite {
  return {
    type: CollectiviteTypeEnum.COMMUNE,
    soustype: null,
    populationTags: [],
    drom: false,
    ...overrides,
  };
}

describe('clé de variante', () => {
  test('null pour le profil de référence, y compris drom à null', () => {
    expect(buildTextVariantKey(identite({ drom: false }))).toBeNull();
    expect(buildTextVariantKey(identite({ drom: null }))).toBeNull();
  });

  test('clé lisible pour une collectivité DOM', () => {
    expect(buildTextVariantKey(identite({ drom: true }))).toBe(
      `r${TEMPLATE_RENDER_VERSION};localisation=dom`
    );
  });

  test('ne dépend pas des champs hors variante', () => {
    expect(
      buildTextVariantKey(
        identite({
          drom: true,
          populationTags: [CollectivitePopulationTypeEnum.MOINS_DE_20000],
        })
      )
    ).toBe(
      buildTextVariantKey(
        identite({
          drom: true,
          type: CollectiviteTypeEnum.EPCI,
          populationTags: [CollectivitePopulationTypeEnum.PLUS_DE_100000],
        })
      )
    );
  });

  test('aller-retour avec parseTextVariantKey', () => {
    for (const variant of listTemplateVariants()) {
      const key = getTextVariantKey(variant);
      if (key === null) {
        expect(variant).toEqual(TEMPLATE_REFERENCE_VARIANT);
      } else {
        expect(parseTextVariantKey(key)).toEqual(variant);
      }
    }
  });

  test.each([
    'r0;localisation=dom',
    `r${TEMPLATE_RENDER_VERSION}`,
    `r${TEMPLATE_RENDER_VERSION};localisation=outremer`,
    `r${TEMPLATE_RENDER_VERSION};population=moins_de_20000`,
    `r${TEMPLATE_RENDER_VERSION};localisation=dom;localisation=dom`,
    `r${TEMPLATE_RENDER_VERSION};localisation=dom=x`,
    '',
  ])('« %s » est une clé invalide', (key) => {
    expect(parseTextVariantKey(key)).toBeNull();
  });
});

describe('identité d’évaluation', () => {
  test('reprend les valeurs de la variante', () => {
    expect(buildTemplateIdentite({ localisation: 'dom' }).drom).toBe(true);
    expect(buildTemplateIdentite({ localisation: 'metropole' }).drom).toBe(
      false
    );
  });

  test('liste tous les profils, la référence en premier', () => {
    expect(listTemplateVariants()).toEqual([
      { localisation: 'metropole' },
      { localisation: 'dom' },
    ]);
  });
});
