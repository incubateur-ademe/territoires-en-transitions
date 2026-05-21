import { describe, expect, it } from 'vitest';
import { buildLiensCsv } from './build-liens-csv';

const HEADER = 'Titre,URL,Commentaire';

describe('buildLiensCsv', () => {
  it('produit un en-tete seul pour une liste vide', () => {
    expect(buildLiensCsv([])).toBe(`${HEADER}\n`);
  });

  it('ecrit une ligne par lien', () => {
    const csv = buildLiensCsv([
      { titre: 'Site officiel', url: 'https://exemple.fr', commentaire: 'a jour' },
    ]);
    expect(csv).toBe(
      `${HEADER}\nSite officiel,https://exemple.fr,a jour\n`
    );
  });

  it('entoure de guillemets les champs contenant une virgule', () => {
    const csv = buildLiensCsv([
      { titre: 'Rapport, version 2', url: 'https://x.fr', commentaire: '' },
    ]);
    expect(csv).toBe(`${HEADER}\n"Rapport, version 2",https://x.fr,\n`);
  });

  it('double les guillemets internes', () => {
    const csv = buildLiensCsv([
      { titre: 'Le "grand" rapport', url: 'https://x.fr', commentaire: '' },
    ]);
    expect(csv).toBe(`${HEADER}\n"Le ""grand"" rapport",https://x.fr,\n`);
  });

  it('entoure de guillemets les champs contenant un saut de ligne', () => {
    const csv = buildLiensCsv([
      { titre: 'ligne1\nligne2', url: 'https://x.fr', commentaire: '' },
    ]);
    expect(csv).toBe(`${HEADER}\n"ligne1\nligne2",https://x.fr,\n`);
  });

  it('neutralise les injections de formule (= + - @) sur titre et commentaire', () => {
    const csv = buildLiensCsv([
      { titre: '=SUM(A1)', url: 'https://x.fr', commentaire: '@cmd' },
    ]);
    expect(csv).toBe(`${HEADER}\n'=SUM(A1),https://x.fr,'@cmd\n`);
  });

  it('neutralise une injection de formule commencant par - ou tabulation', () => {
    const csv = buildLiensCsv([
      { titre: '-2+3', url: 'https://x.fr', commentaire: '\tcmd' },
    ]);
    expect(csv).toBe(`${HEADER}\n'-2+3,https://x.fr,'\tcmd\n`);
  });

  it("remplace les URLs aux schemes non sûrs par un placeholder (javascript:/data:/etc)", () => {
    const csv = buildLiensCsv([
      { titre: 'XSS', url: 'javascript:alert(1)', commentaire: '' },
      { titre: 'Data URI', url: 'data:text/html,xxx', commentaire: '' },
      { titre: 'OK', url: 'https://example.com', commentaire: '' },
    ]);
    expect(csv).toBe(
      `${HEADER}\nXSS,[URL non sûre],\nData URI,[URL non sûre],\nOK,https://example.com,\n`
    );
  });

  it('neutralise la formule puis applique l’echappement CSV', () => {
    const csv = buildLiensCsv([
      { titre: '=SUM(A1,A2)', url: 'https://x.fr', commentaire: '' },
    ]);
    expect(csv).toBe(`${HEADER}\n"'=SUM(A1,A2)",https://x.fr,\n`);
  });
});
