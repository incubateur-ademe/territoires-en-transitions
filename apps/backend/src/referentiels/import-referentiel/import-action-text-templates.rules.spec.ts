import {
  buildActionTextColumns,
  verifyActionTextTemplates,
} from './import-action-text-templates.rules';

describe('verifyActionTextTemplates', () => {
  test('aperçu des variantes, rendus identiques regroupés', () => {
    const { errors, warnings, previews } = verifyActionTextTemplates([
      {
        actionId: 'te_1.1',
        nom: 'Suivre le {{si dom}}SAR{{sinon}}SRADDET{{/si}}',
        description: 'Sans balise',
      },
    ]);

    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(previews).toEqual([
      {
        actionId: 'te_1.1',
        field: 'nom',
        variants: [
          { label: 'Métropole (par défaut)', text: 'Suivre le SRADDET' },
          { label: 'DOM', text: 'Suivre le SAR' },
        ],
      },
    ]);
  });

  test('avertit d’une balise sans effet et d’une condition constante', () => {
    const { errors, warnings, previews } = verifyActionTextTemplates([
      { actionId: 'te_1.1', exemples: '{{si dom}}X{{sinon}}X{{/si}}' },
      { actionId: 'te_1.2', exemples: '{{si dom ou metropole}}Y{{/si}}' },
    ]);

    expect(errors).toEqual([]);
    expect(warnings).toEqual([
      "L'action te_1.1, colonne exemples : les balises n’ont aucun effet, le texte est le même pour tous les profils",
      "L'action te_1.2, colonne exemples : les balises n’ont aucun effet, le texte est le même pour tous les profils",
      "L'action te_1.2, colonne exemples : la condition {{si dom ou metropole}} vaut toujours vrai",
    ]);
    expect(previews[0].variants).toEqual([
      { label: 'Métropole (par défaut) / DOM', text: 'X' },
    ]);
  });

  test('refuse des accolades doubles qui ne forment pas une balise', () => {
    expect(
      verifyActionTextTemplates([{ actionId: 'cae_1.1', ressources: 'a }} b' }])
        .errors
    ).toEqual([
      expect.stringContaining(
        "L'action cae_1.1, colonne ressources : accolades doubles"
      ),
    ]);
  });
});

describe('buildActionTextColumns', () => {
  test('rendu par défaut dans les colonnes, sources dans templates', () => {
    expect(
      buildActionTextColumns({
        nom: 'Suivre le {{si dom}}SAR{{sinon}}SRADDET{{/si}}',
        description: 'Sans balise',
        preuve: '- A\n{{si dom}}\n- B\n{{/si}}',
      })
    ).toEqual({
      texts: { nom: 'Suivre le SRADDET', preuve: '- A' },
      templates: {
        nom: 'Suivre le {{si dom}}SAR{{sinon}}SRADDET{{/si}}',
        preuve: '- A\n{{si dom}}\n- B\n{{/si}}',
      },
    });
  });

  test('templates est null quand plus aucun champ n’est balisé', () => {
    expect(
      buildActionTextColumns({ nom: 'Suivre le SRADDET', preuve: null })
    ).toEqual({ texts: {}, templates: null });
  });
});
