import { describe, expect, it } from 'vitest';
import { buildDocument, buildPage } from '../document/document-page';
import { detectHeadings } from './detect-headings';
import { segmentDocument } from './segment-document';
import { renderUnit } from './render-unit';

describe('segmentDocument', () => {
  it('numérote les unités d’un PDF dans l’ordre, en sautant les pages vides', () => {
    const document = buildDocument('pdf', [
      buildPage(0, [{ text: 'Axe 1 : Bâtiments' }]),
      buildPage(1, []),
      buildPage(2, [
        { text: 'Action 1.1.1 : Isoler' },
        { text: 'Pilote : Service' },
      ]),
    ]);

    const units = segmentDocument(document, {
      minTokens: 0,
      maxTokens: 1000,
      overlapTokens: 0,
    });

    expect(units.map((unit) => unit.id)).toEqual(['u0001', 'u0002']);
    expect(units[1]).toMatchObject({ kind: 'fiche', pageStart: 2, pageEnd: 2 });
  });

  it('découpe un tableur par lignes entières, en-tête répété', () => {
    const rows = Array.from(
      { length: 30 },
      (_, i) => `Axe ${i % 3}\tAction ${i}\tDescription assez longue ${i}`
    );
    const document = buildDocument('xlsx', [
      buildPage(
        0,
        ['axe\ttitre\tdescription', ...rows].map((text) => ({ text })),
        { label: 'Actions' }
      ),
    ]);

    const units = segmentDocument(document, {
      minTokens: 0,
      maxTokens: 120,
      overlapTokens: 0,
    });

    expect(units.length).toBeGreaterThan(1);
    for (const unit of units) {
      expect(unit.kind).toBe('table');
      expect(unit.lines[0].text).toBe('axe\ttitre\tdescription');
      expect(unit.headingPath).toEqual(['Actions']);
    }
    const allRows = units.flatMap((unit) =>
      unit.lines.slice(1).map((line) => line.text)
    );
    expect(allRows).toEqual(rows);
  });
});

const body = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `Un paragraphe de corps de texte normal, numéro ${i}.`,
    fontSize: 12,
  }));

describe('detectHeadings', () => {
  it('lit un titre en grande police réparti sur plusieurs lignes', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: 'ENGAGEMENT', fontSize: 70 },
        { text: 'DES PARTENAIRES', fontSize: 70 },
        ...body(5),
      ]),
    ]);

    expect(headings).toEqual([
      {
        pageIndex: 0,
        lineIndex: 0,
        lastLineIndex: 1,
        isLarge: true,
        match: expect.objectContaining({
          kind: 'section',
          title: 'ENGAGEMENT DES PARTENAIRES',
        }),
      },
    ]);
  });

  it('recolle le début du titre au-dessus du numéro de fiche', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: 'I. TOUS HÉROS ORDINAIRES', fontSize: 12 },
        { text: 'ANCRER L’ADMINISTRATION', fontSize: 20 },
        { text: '1 DANS L’ÉCO-RESPONSABILITÉ', fontSize: 40 },
        ...body(5),
      ]),
    ]);

    expect(headings.map(({ lineIndex, match }) => [lineIndex, match])).toEqual([
      [0, expect.objectContaining({ kind: 'axe', number: 'I' })],
      [
        1,
        expect.objectContaining({
          kind: 'numero',
          number: '1',
          title: 'ANCRER L’ADMINISTRATION DANS L’ÉCO-RESPONSABILITÉ',
        }),
      ],
    ]);
  });

  it('recolle un début de titre en un seul mot, ou sur deux lignes', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: 'APPROFONDIR', fontSize: 20 },
        { text: '1 LA CONNAISSANCE LOCALE', fontSize: 40 },
        ...body(3),
        { text: 'SE PRÉPARER AU CLIMAT', fontSize: 20 },
        { text: 'DE DEMAIN :', fontSize: 20 },
        { text: '2 LA VILLE VÉGÉTALE', fontSize: 40 },
        ...body(3),
      ]),
    ]);

    expect(
      headings.map(({ lineIndex, match }) => [lineIndex, match.title])
    ).toEqual([
      [0, 'APPROFONDIR LA CONNAISSANCE LOCALE'],
      [5, 'SE PRÉPARER AU CLIMAT DE DEMAIN : LA VILLE VÉGÉTALE'],
    ]);
  });

  it('écarte un numéro seul qui ne prolonge pas la suite des fiches', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: '66 PLAN CLIMAT', fontSize: 40 },
        { text: '1 SOBRIÉTÉ ÉNERGÉTIQUE', fontSize: 40 },
        { text: '2 MOBILITÉ DOUCE', fontSize: 40 },
        { text: '40 GIGAWATTS ÉVITÉS', fontSize: 40 },
        ...body(8),
      ]),
    ]);

    expect(headings.map(({ match }) => match.number)).toEqual(['1', '2']);
  });

  it('ignore les lignes en toute petite police, comme les logos', () => {
    expect(
      detectHeadings([
        buildPage(0, [
          { text: 'LOGOTYPE TONS DIRECTS', fontSize: 2 },
          ...body(5),
        ]),
      ])
    ).toEqual([]);
  });

  it('tient une ligne en majuscules pour un grand titre quand sa police est plus grande', () => {
    const pages = [
      buildPage(0, [
        { text: 'RÉNOVER LE PATRIMOINE BÂTI', fontSize: 18 },
        { text: 'Un paragraphe de corps de texte normal.', fontSize: 10 },
        { text: 'Un autre paragraphe de corps de texte.', fontSize: 10 },
      ]),
    ];

    expect(detectHeadings(pages)).toEqual([
      {
        pageIndex: 0,
        lineIndex: 0,
        lastLineIndex: 0,
        isLarge: true,
        match: expect.objectContaining({ level: 1, confidence: 0.8 }),
      },
    ]);
  });
});

describe('detectHeadings sur un PCAET à fiches tabulaires', () => {
  const titles = (pages: ReturnType<typeof buildPage>[]) =>
    detectHeadings(pages).map(({ match }) => [
      match.kind,
      match.level,
      match.title,
    ]);

  it("prend le bandeau d'objectif au-dessus d'une fiche pour son sous-axe, et recolle le titre long de la fiche", () => {
    expect(
      titles([
        buildPage(0, [
          { text: '1- AMELIORER LA PERFORMANCE DES BATIMENTS', fontSize: 16 },
          {
            text: 'ACTION 2 - ACCOMPAGNER LES PROJETS DE CONSTRUCTION POUR ATTEINDRE DES OBJECTIFS DE',
            fontSize: 16,
          },
          {
            text: 'PERFORMANCE DE "TRES BASSE CONSOMMATION" OU "PASSIF"',
            fontSize: 16,
          },
          ...body(5),
        ]),
      ])
    ).toEqual([
      ['orientation', 2, 'AMELIORER LA PERFORMANCE DES BATIMENTS'],
      [
        'fiche',
        3,
        'ACCOMPAGNER LES PROJETS DE CONSTRUCTION POUR ATTEINDRE DES OBJECTIFS DE PERFORMANCE DE "TRES BASSE CONSOMMATION" OU "PASSIF"',
      ],
    ]);
  });

  it("recolle la suite d'un titre de fiche dans une autre grande police, sans avaler le titre suivant", () => {
    expect(
      titles([
        buildPage(0, [
          { text: '1- ASSURER LA GOUVERNANCE DU PCAET', fontSize: 16 },
          { text: 'ACTION 1- PILOTER ET EVALUER LE PCAET', fontSize: 16 },
          ...body(5),
        ]),
        buildPage(1, [
          {
            text: "ACTION 1 - SYSTEMATISER L'INTEGRATION DES ENERGIES RENOUVELABLES DANS LES",
            fontSize: 20,
          },
          { text: 'BATIMENTS PUBLICS', fontSize: 16 },
          ...body(5),
        ]),
      ])
    ).toEqual([
      ['orientation', 2, 'ASSURER LA GOUVERNANCE DU PCAET'],
      ['fiche', 3, 'PILOTER ET EVALUER LE PCAET'],
      [
        'fiche',
        3,
        "SYSTEMATISER L'INTEGRATION DES ENERGIES RENOUVELABLES DANS LES BATIMENTS PUBLICS",
      ],
    ]);
  });

  it("ne prend pas les lignes d'un tableau récapitulatif pour des fiches", () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'Axe stratégique Intitulé de l’action', fontSize: 12 },
          { text: '2.1.1 Accompagner les collectivités', fontSize: 12 },
          {
            text: '2.1.2 Accompagner les projets de construction',
            fontSize: 12,
          },
          { text: '2/ Engager', fontSize: 12 },
          { text: '2.1.3 Assurer le suivi des consommations', fontSize: 12 },
          {
            text: '2.1.4 Réduire la consommation de l’éclairage',
            fontSize: 12,
          },
          ...body(2),
        ]),
      ])
    ).toEqual([]);
  });

  it('ne prend pas un intertitre de fiche en corps de texte, entre deux fiches, pour une partie du document', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'ACTION 1- PILOTER ET EVALUER LE PCAET', fontSize: 16 },
          ...body(3),
          { text: 'Suivi et évaluation', fontSize: 12 },
          ...body(3),
        ]),
        buildPage(1, [
          { text: 'ACTION 2- FORMER LES ELUS', fontSize: 16 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'PILOTER ET EVALUER LE PCAET'],
      ['fiche', 3, 'FORMER LES ELUS'],
    ]);
  });

  it("ne fait pas un axe d'une ligne en majuscules quand le document nomme ses axes, sauf si elle se dit axe", () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'AXE STRATEGIQUE 4 - AMELIORER LES BÂTIMENTS', fontSize: 20 },
          ...body(3),
          { text: 'ENERGETIQUE DES BATIMENTS TERTIAIRES', fontSize: 16 },
          ...body(3),
          { text: 'AXE TRANSVERSAL', fontSize: 20 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['axe', 1, 'AMELIORER LES BÂTIMENTS'],
      ['majuscules', 2, 'ENERGETIQUE DES BATIMENTS TERTIAIRES'],
      ['majuscules', 1, 'AXE TRANSVERSAL'],
    ]);
  });

  it('garde une partie après la dernière fiche, ou sans taille de police connue', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'ACTION 1- PILOTER ET EVALUER LE PCAET', fontSize: 16 },
          ...body(3),
          { text: 'Annexes', fontSize: 12 },
          ...body(3),
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'PILOTER ET EVALUER LE PCAET'],
      ['section', 0, 'Annexes'],
    ]);
    expect(
      titles([
        buildPage(0, [
          { text: 'Action 1 : Piloter le PCAET' },
          { text: 'Un paragraphe de description.' },
          { text: 'Suivi et évaluation' },
          { text: 'Action 2 : Former les agents' },
        ]),
      ])
    ).toEqual([
      ['fiche', 3, 'Piloter le PCAET'],
      ['section', 0, 'Suivi et évaluation'],
      ['fiche', 3, 'Former les agents'],
    ]);
  });

  it('garde les fiches d’un plan compact, deux lignes de texte par action', () => {
    const action = (number: string, title: string) => [
      { text: `${number} ${title}`, fontSize: 12 },
      { text: 'Une première ligne de description de l’action.', fontSize: 12 },
      { text: 'Une seconde ligne de description de l’action.', fontSize: 12 },
    ];

    expect(
      titles([
        buildPage(0, [
          ...action('1.2.1', 'Rénover les écoles'),
          ...action('1.2.2', 'Isoler la mairie'),
          ...action('1.2.3', 'Équiper les gymnases'),
          ...action('1.2.4', 'Suivre les consommations'),
        ]),
      ]).map(([kind]) => kind)
    ).toEqual(['fiche', 'fiche', 'fiche', 'fiche']);
  });

  it('ne colle pas un chiffre clé en grand au titre de la fiche', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'ACTION 2 - RÉNOVER LES ÉCOLES', fontSize: 16 },
          { text: '2030', fontSize: 30 },
          { text: '400 000 €', fontSize: 24 },
          ...body(5),
        ]),
      ])
    ).toEqual([['fiche', 3, 'RÉNOVER LES ÉCOLES']]);
  });

  it('recolle la suite d’un titre en colonne gauche par-dessus le texte de la colonne voisine', () => {
    expect(
      titles([
        buildPage(0, [
          { text: 'ACTION 2 - ACCOMPAGNER LES', fontSize: 16, y: 100 },
          {
            text: 'texte courant de la colonne de droite, en minuscules',
            fontSize: 12,
            y: 100,
          },
          { text: 'PROJETS DE RÉNOVATION', fontSize: 16, y: 120 },
          {
            text: 'suite du texte de la colonne de droite',
            fontSize: 12,
            y: 120,
          },
          ...body(5),
        ]),
      ])
    ).toEqual([['fiche', 3, 'ACCOMPAGNER LES PROJETS DE RÉNOVATION']]);
  });
});

describe('renderUnit', () => {
  it('situe l’extrait et marque les changements de page', () => {
    const [unit] = segmentDocument(
      buildDocument('pdf', [
        buildPage(3, [{ text: 'Action 1.1.1 : Isoler' }, { text: 'Début.' }]),
        buildPage(4, [{ text: 'Suite.' }]),
      ]),
      { minTokens: 0, maxTokens: 1000, overlapTokens: 0 }
    );

    expect(renderUnit(unit, { index: 1, count: 3 })).toBe(
      '[Extrait 2/3 · pages 4–5 · fiche « 1.1.1 Isoler »]\nAction 1.1.1 : Isoler\nDébut.\n[page 5]\nSuite.'
    );
  });

  it('nomme la partie du document avant le chemin des titres', () => {
    const units = segmentDocument(
      buildDocument('pdf', [
        buildPage(0, [
          { text: "PLAN D'ACTIONS" },
          { text: 'Axe 1 : Bâtiments' },
          { text: 'Action 1.1 : Isoler' },
        ]),
      ]),
      { minTokens: 0, maxTokens: 1000, overlapTokens: 0 }
    );

    expect(renderUnit(units[2], { index: 2, count: 3 })).toBe(
      "[Extrait 3/3 · page 1 · partie « PLAN D'ACTIONS » · 1 Bâtiments · fiche « 1.1 Isoler »]\nAction 1.1 : Isoler"
    );
  });
});
