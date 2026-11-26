import { describe, expect, it } from 'vitest';
import { buildDocument, buildPage } from './document-page';
import {
  isGarbledText,
  isMostlyUnreadable,
  measureReadingStats,
} from './reading-stats';

const READABLE = 'Un paragraphe assez long pour compter comme une page lue.';

describe('measureReadingStats', () => {
  it('compte les pages vides, sans mot, brouillées ou en échec d’OCR', () => {
    const document = buildDocument(
      'pdf',
      [
        buildPage(0, [{ text: READABLE }]),
        buildPage(1, [{ text: '12' }]),
        buildPage(2, [], { source: 'empty' }),
        buildPage(3, [{ text: READABLE }]),
        buildPage(
          4,
          [{ text: 'Pl@n d4ct1ons c0mmun@ut3 ~~ $$ l3s m3sur#s pr1orit@ires' }],
          { source: 'ocr' }
        ),
      ],
      [{ pageIndex: 3, reason: 'timeout' }]
    );

    expect(measureReadingStats(document)).toEqual({
      pageCount: 5,
      unreadablePages: 4,
    });
  });

  it('lit un diaporama à couverture et intercalaires courts : aucune page illisible', () => {
    const fiche = (index: number) =>
      buildPage(index, [
        {
          text: `Action ${index} : Développer des stationnements vélos sécurisés`,
        },
        { text: 'Pilote : service mobilité. Calendrier : 2025-2027.' },
      ]);
    const document = buildDocument('pdf', [
      buildPage(0, [{ text: 'PLAN MOBILITÉ 2025' }]),
      buildPage(1, [{ text: 'AXE 1 : S’adapter aux enjeux du futur' }]),
      fiche(2),
      fiche(3),
      buildPage(4, [{ text: 'AXE 2 : Se déplacer autrement' }]),
      fiche(5),
      fiche(6),
      buildPage(7, [{ text: 'AXE 3 : Partager la voirie' }]),
      fiche(8),
      buildPage(9, [{ text: 'Merci de votre attention' }]),
    ]);

    const stats = measureReadingStats(document);

    expect(stats).toEqual({ pageCount: 10, unreadablePages: 0 });
    expect(isMostlyUnreadable(stats)).toBe(false);
  });

  it('ne compte rien pour un tableur', () => {
    expect(
      measureReadingStats(buildDocument('csv', [buildPage(0, [{ text: 'a' }])]))
    ).toBeUndefined();
  });
});

describe('isMostlyUnreadable', () => {
  it('à partir de 30 % des pages', () => {
    expect(isMostlyUnreadable({ pageCount: 10, unreadablePages: 3 })).toBe(
      true
    );
    expect(isMostlyUnreadable({ pageCount: 10, unreadablePages: 2 })).toBe(
      false
    );
    expect(isMostlyUnreadable(undefined)).toBe(false);
  });
});

describe('isGarbledText', () => {
  it.each([
    'PLAN MOBILITÉ 2025',
    'TOME 3 – PLAN D’ACTIONS',
    'Merci de votre attention',
    'Développer des stationnements vélos sécurisés',
    'Budget : 12 000 € HT, 2025-2027',
  ])('« %s » est lisible', (text) => {
    expect(isGarbledText(text)).toBe(false);
  });

  it.each([
    '12',
    '',
    '~~ ## //',
    'Pl@n d4ct1ons c0mmun@ut3',
    'xkcd qwrtz lmnpq',
  ])('« %s » ne se lit pas', (text) => {
    expect(isGarbledText(text)).toBe(true);
  });
});
