import { describe, expect, it } from 'vitest';
import {
  buildMixedWorkbook,
  readTestGrids,
} from '../pipeline/__fixtures__/build-test-workbook';
import { analyzeWorkbook } from '../pipeline/analyze-workbook/analyze-workbook';
import { describeWorkbookAnalysis } from './describe-workbook-analysis';

describe('describeWorkbookAnalysis', () => {
  it('montre rôles, colonnes, arbre et onglets confiés au modèle', async () => {
    const analysis = analyzeWorkbook(
      await readTestGrids(await buildMixedWorkbook())
    );

    const lines = describeWorkbookAnalysis(analysis);

    expect(lines).toEqual(
      expect.arrayContaining([
        '  « Feuil1 » : plan, forme horizontale, confiance 100 % (5 fiches, forme horizontale)',
        "    A « Axe » → niveau d'axe (axe ; niveau 1 : 3 blocs répétés)",
        '    B « Action » → titre de fiche (fiche ; une fiche par rangée)',
        'Arbre : 5 fiche(s), 0 sous-action(s)',
        '  ▸ Mobilité (2 fiche(s))',
        '    • Créer une ligne de bus express vers la gare — 0 sous-action(s)',
        '  ▸ Habitat (2 fiche(s))',
        'Onglets confiés au modèle : « Notes du comité »',
      ])
    );
  });
});
