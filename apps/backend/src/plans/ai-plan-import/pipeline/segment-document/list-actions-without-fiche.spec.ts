import { describe, expect, it } from 'vitest';
import { buildUnit, DocumentUnit, numberUnits } from './document-unit';
import {
  detectActionsWithoutFicheDoubt,
  selectActionPlanUnits,
} from './list-actions-without-fiche';

const PLAN = 'VII. PLACE À L’ACTION ! PLAN D’ACTIONS';

/** Le tableau du plan : les actions à poursuivre, puis celles à engager. */
const recap = (
  numbers: number[],
  { withFiche, pageIndex = 47 }: { withFiche: number[]; pageIndex?: number },
  section = PLAN
): DocumentUnit =>
  buildUnit(
    numbers.map((number) => ({
      text: `Action à ${
        withFiche.includes(number) ? 'engager' : 'poursuivre'
      } ${number} : Mener l’action ${number}`,
      pageIndex: pageIndex + Math.floor(number / 20),
    })),
    ['1 Connaître'],
    'table',
    { section }
  );

const fiche = (number: number, section = PLAN): DocumentUnit =>
  buildUnit(
    [{ text: `${number} Mener l’action ${number}`, pageIndex: 50 + number }],
    ['1 Connaître'],
    'fiche',
    { section, title: `${number} Mener l’action ${number}` }
  );

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

describe('detectActionsWithoutFicheDoubt', () => {
  it('demande s’il faut créer les actions du tableau qu’aucune fiche ne détaille', () => {
    const withFiche = [3, 5, ...range(7, 11), 21, 22, 24, 25];
    const units = numberUnits([
      recap(range(1, 30), { withFiche }),
      ...withFiche.map((number) => fiche(number)),
    ]);

    expect(detectActionsWithoutFicheDoubt(units)).toEqual({
      kind: 'actions-without-fiche',
      listed: 30,
      withFiche: 11,
      withoutFiche: 19,
      example: {
        title: 'Action à poursuivre 1 : Mener l’action 1',
        page: 48,
      },
      tablePages: [48, 49],
      proposed: 'all',
    });
  });

  it('se tait quand les numéros des fiches ne se retrouvent pas au tableau', () => {
    const units = numberUnits([
      recap(range(1, 30), { withFiche: [] }),
      ...range(101, 111).map((number) => fiche(number)),
    ]);

    expect(detectActionsWithoutFicheDoubt(units)).toBeNull();
  });

  it('se tait quand le tableau liste moins de mesures qu’il n’y a de fiches', () => {
    const units = numberUnits([
      recap(range(1, 14), { withFiche: range(1, 14) }),
      ...range(1, 43).map((number) => fiche(number)),
    ]);

    expect(detectActionsWithoutFicheDoubt(units)).toBeNull();
  });

  it('se tait quand le tableau redit les fiches, à peu près autant qu’elles', () => {
    const units = numberUnits([
      recap(range(1, 12), { withFiche: range(1, 10) }),
      ...range(1, 10).map((number) => fiche(number)),
    ]);

    expect(detectActionsWithoutFicheDoubt(units)).toBeNull();
  });

  it('ne lit que le périmètre du tri : ni les partenaires, ni hors de la partie des fiches', () => {
    const withFiche = range(1, 10);
    const fiches = withFiche.map((number) => fiche(number));

    expect(
      detectActionsWithoutFicheDoubt(
        numberUnits([
          recap(range(1, 30), { withFiche }, 'ENGAGEMENTS DES PARTENAIRES'),
          ...fiches,
        ])
      )
    ).toBeNull();
    expect(
      detectActionsWithoutFicheDoubt(
        numberUnits([
          recap(range(1, 30), { withFiche }, 'DIAGNOSTIC'),
          ...fiches,
        ])
      )
    ).toBeNull();
  });
});

describe('selectActionPlanUnits', () => {
  it('garde la seule partie des fiches quand elle en contient au moins trois', () => {
    const diagnostic = buildUnit(
      [{ text: 'Le territoire', pageIndex: 0 }],
      [],
      'section',
      { section: 'DIAGNOSTIC' }
    );
    const fiches = range(1, 3).map((number) => fiche(number));

    const { readable, units } = selectActionPlanUnits([diagnostic, ...fiches]);

    expect(readable).toHaveLength(4);
    expect(units).toEqual(fiches);
  });
});
