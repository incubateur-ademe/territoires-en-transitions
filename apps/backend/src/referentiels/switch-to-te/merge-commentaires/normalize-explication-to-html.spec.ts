import {
  isExplicationHtml,
  legacyPlainTextToHtml,
  normalizeExplicationToHtml,
} from './normalize-explication-to-html';

describe('normalize-explication-to-html', () => {
  describe('isExplicationHtml', () => {
    it('détecte le HTML même précédé d espaces', () => {
      expect(isExplicationHtml('<p>déjà migré</p>')).toBe(true);
      expect(isExplicationHtml('  \n<p>déjà migré</p>')).toBe(true);
    });

    it('rejette le texte brut', () => {
      expect(isExplicationHtml('ligne 1\nligne 2')).toBe(false);
      expect(isExplicationHtml('a < b')).toBe(false);
    });
  });

  describe('legacyPlainTextToHtml', () => {
    it('crée un paragraphe par ligne', () => {
      expect(legacyPlainTextToHtml('ligne 1\nligne 2')).toBe(
        '<p>ligne 1</p>\n<p>ligne 2</p>'
      );
    });

    it('insère un paragraphe non vide entre deux sections séparées par une ligne vide', () => {
      expect(
        legacyPlainTextToHtml('parking A\nparking B\n\nVISITE 2025')
      ).toBe(
        '<p>parking A</p>\n<p>parking B</p>\n<p>&nbsp;</p>\n<p>VISITE 2025</p>'
      );
    });

    it('gère les retours chariot Windows', () => {
      expect(legacyPlainTextToHtml('ligne 1\r\nligne 2')).toBe(
        '<p>ligne 1</p>\n<p>ligne 2</p>'
      );
    });

    it('échappe les caractères spéciaux HTML', () => {
      expect(legacyPlainTextToHtml('a < b && c > d')).toBe(
        '<p>a &lt; b &amp;&amp; c &gt; d</p>'
      );
    });

    it('retourne un paragraphe vide si le texte ne contient que des lignes vides', () => {
      expect(legacyPlainTextToHtml('\n  \n')).toBe('<p>&nbsp;</p>');
    });
  });

  describe('normalizeExplicationToHtml', () => {
    it('conserve le HTML déjà migré tel quel', () => {
      const html = '<p class="!text-base">déjà migré</p>';
      expect(normalizeExplicationToHtml(html)).toBe(html);
    });

    it('convertit le texte brut hérité en préservant les sauts de ligne', () => {
      expect(normalizeExplicationToHtml('ligne 1\nligne 2')).toBe(
        '<p>ligne 1</p>\n<p>ligne 2</p>'
      );
    });
  });
});
