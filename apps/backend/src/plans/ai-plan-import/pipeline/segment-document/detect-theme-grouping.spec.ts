import { describe, expect, it } from 'vitest';
import { detectThemeGroupingDoubt } from './detect-theme-grouping';
import { buildUnit, DocumentUnit } from './document-unit';

const section = (pageIndex: number, lines: string[]): DocumentUnit =>
  buildUnit(
    lines.map((text) => ({ text, pageIndex })),
    [],
    'section'
  );

const fiche = (pageIndex: number, theme: string, title: string): DocumentUnit =>
  buildUnit(
    [
      { text: `Action ${title}`, pageIndex },
      { text: 'Pilote : Service déchets', pageIndex },
    ],
    [theme],
    'fiche',
    { title }
  );

const biodechets = [
  fiche(
    5,
    'BIODECHETS (restes alimentaires)',
    '1 Organiser le compostage individuel des foyers'
  ),
  fiche(
    6,
    'BIODECHETS (restes alimentaires)',
    '2 Lutter contre le gaspillage alimentaire'
  ),
  fiche(
    7,
    'BIODECHETS (végétaux)',
    '3 Promouvoir le broyage des végétaux du jardin'
  ),
  fiche(
    8,
    'DECHETS EN MER',
    '4 Lutter contre les dépôts sauvages en bord de mer'
  ),
];

describe('detectThemeGroupingDoubt', () => {
  it('propose de réunir les thèmes qu’une page de synthèse range sous un seul libellé', () => {
    const doubt = detectThemeGroupingDoubt([
      section(2, [
        'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX',
        '1. Organiser le compostage individuel des foyers',
        '3. Promouvoir le broyage des végétaux du jardin',
        'DÉCHETS EN MER',
        '4. Lutter contre les dépôts sauvages en bord de mer',
      ]),
      ...biodechets,
    ]);

    expect(doubt).toEqual({
      kind: 'theme-grouping',
      groups: [
        {
          label: 'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX',
          labelPage: 3,
          variants: [
            {
              theme: 'BIODECHETS (restes alimentaires)',
              fiches: 2,
              exampleTitle: '1 Organiser le compostage individuel des foyers',
              page: 6,
            },
            {
              theme: 'BIODECHETS (végétaux)',
              fiches: 1,
              exampleTitle: '3 Promouvoir le broyage des végétaux du jardin',
              page: 8,
            },
          ],
        },
      ],
      proposed: 'grouped',
    });
  });

  it('réunit aussi deux thèmes qui commencent par les mêmes mots porteurs', () => {
    const doubt = detectThemeGroupingDoubt([
      section(2, [
        'DÉCHETS ASSIMILÉS - DÉCHETS DES ACTIVITÉS ÉCONOMIQUES',
        '7. Redéfinir les contours du service public',
        "8. Initier une démarche d'EIT entre entreprises",
      ]),
      fiche(
        5,
        'DECHETS ASSIMILES - DECHETS DES ACTIVITES ECONOMIQUES',
        '7 Redéfinir les contours du service public'
      ),
      fiche(
        6,
        'DECHETS ASSIMILES PRIS EN CHARGE PAR LE SERVICE PUBLIC',
        "8 Initier une démarche d'EIT entre entreprises"
      ),
    ]);

    expect(
      doubt?.groups.map(({ label, variants }) => [label, variants.length])
    ).toEqual([['DÉCHETS ASSIMILÉS - DÉCHETS DES ACTIVITÉS ÉCONOMIQUES', 2]]);
  });

  it('ne demande rien quand le sommaire liste chaque thème séparément', () => {
    const doubt = detectThemeGroupingDoubt([
      section(2, [
        'BIODECHETS (restes alimentaires)',
        '1. Organiser le compostage individuel des foyers',
        'BIODECHETS (végétaux)',
        '3. Promouvoir le broyage des végétaux du jardin',
      ]),
      ...biodechets,
    ]);

    expect(doubt).toBeNull();
  });

  it('ne demande rien quand la ligne de regroupement ne cite aucune fiche', () => {
    const doubt = detectThemeGroupingDoubt([
      section(2, [
        'BIODÉCHETS : RESTES ALIMENTAIRES ET VÉGÉTAUX',
        'Un enjeu majeur du territoire.',
      ]),
      ...biodechets,
    ]);

    expect(doubt).toBeNull();
  });

  it('ne demande rien pour des thèmes de deux pages différentes du sommaire', () => {
    const doubt = detectThemeGroupingDoubt([
      section(2, [
        'ACTIONS EN FAVEUR DES ENTREPRISES',
        '1. Aider les commerces à réduire leurs emballages',
      ]),
      section(3, [
        'ACTIONS EN FAVEUR DES HABITANTS',
        '2. Informer les habitants sur le tri des déchets',
      ]),
      fiche(
        5,
        'ACTIONS EN FAVEUR DES ENTREPRISES',
        '1 Aider les commerces à réduire leurs emballages'
      ),
      fiche(
        6,
        'ACTIONS EN FAVEUR DES HABITANTS',
        '2 Informer les habitants sur le tri des déchets'
      ),
    ]);

    expect(doubt).toBeNull();
  });

  it.each([
    [
      'numérotés',
      ['1 BIODECHETS (restes alimentaires)', '2 BIODECHETS (végétaux)'],
    ],
    [
      'qui ne partagent qu’un mot',
      ['BRIQUE – Consommer local', 'BRIQUE : Produire autrement'],
    ],
  ])('ne demande rien pour des thèmes %s', (_cas, [first, second]) => {
    const doubt = detectThemeGroupingDoubt([
      section(2, [
        `${first.replace(/^\d /u, '').split(/[(–:]/u)[0]}`,
        '1. Organiser le compostage individuel des foyers',
        '3. Promouvoir le broyage des végétaux du jardin',
      ]),
      fiche(5, first, '1 Organiser le compostage individuel des foyers'),
      fiche(6, second, '3 Promouvoir le broyage des végétaux du jardin'),
    ]);

    expect(doubt).toBeNull();
  });
});
