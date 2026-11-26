import { describe, expect, it } from 'vitest';
import { withReadingChoicesInstructions } from './reading-choices-instructions';

describe('withReadingChoicesInstructions', () => {
  it.each([
    ['sans réponse', undefined],
    ['avec une réponse sans niveau', {}],
    [
      'avec les seuls thèmes, réglés avant l’extraction',
      { themeGrouping: { grouping: 'separate' as const, groups: [] } },
    ],
    [
      'quand seules les actions qui ont une fiche sont gardées, réglé au tri',
      { actionsWithoutFiche: 'with-fiche' as const },
    ],
  ])('laisse les consignes inchangées %s', (_cas, choices) => {
    expect(withReadingChoicesInstructions('  Consigne  ', choices)).toBe(
      '  Consigne  '
    );
  });

  it('place la consigne du choix avant celles de l’utilisateur', () => {
    expect(
      withReadingChoicesInstructions('Consigne', { actionLevel: 'etape' })
    ).toMatch(/^Chaque étape titrée .*\nConsigne$/u);
  });

  it('donne la consigne d’une énumération lue à la mesure', () => {
    expect(
      withReadingChoicesInstructions('Consigne', {
        actionLevel: 'fiche',
        etapesFrom: 'enumeration',
      })
    ).toMatch(/^Chaque titre qui énumère des actions .*\nConsigne$/u);
  });

  it('laisse le prompt inchangé pour une énumération lue à l’élément, comme avant la question', () => {
    expect(
      withReadingChoicesInstructions('Consigne', {
        actionLevel: 'etape',
        etapesFrom: 'enumeration',
      })
    ).toBe('Consigne');
  });

  it('demande de relever les actions du récapitulatif qu’aucune fiche ne détaille', () => {
    expect(
      withReadingChoicesInstructions('Consigne', { actionsWithoutFiche: 'all' })
    ).toMatch(
      /^Chaque action numérotée d'un tableau récapitulatif .*même quand aucune fiche ne la détaille.*\nConsigne$/u
    );
  });

  it('se passe des consignes vides de l’utilisateur', () => {
    expect(
      withReadingChoicesInstructions('  ', { actionLevel: 'fiche' })
    ).toMatch(/^Chaque fiche titrée [^\n]*$/u);
  });
});
