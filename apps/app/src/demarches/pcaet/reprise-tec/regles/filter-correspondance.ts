const normalize = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const estLigneDeTableau = (ligne: string) => ligne.trimStart().startsWith('|');
const estSeparateur = (ligne: string) => /^\s*\|[\s|:-]+\|\s*$/.test(ligne);

export const filterCorrespondance = (markdown: string, recherche: string) => {
  const mots = normalize(recherche).split(/\s+/).filter(Boolean);
  if (mots.length === 0) {
    return markdown;
  }
  const correspond = (ligne: string) => {
    const texte = normalize(ligne);
    return mots.every((mot) => texte.includes(mot));
  };

  const sortie: string[] = [];
  const lignes = markdown.split('\n');
  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    if (ligne.startsWith('#')) {
      sortie.push('', ligne, '');
      continue;
    }
    if (estLigneDeTableau(ligne) && estSeparateur(lignes[i + 1] ?? '')) {
      const entete = [ligne, lignes[i + 1]];
      const corps: string[] = [];
      i += 2;
      while (i < lignes.length && estLigneDeTableau(lignes[i])) {
        if (correspond(lignes[i])) corps.push(lignes[i]);
        i++;
      }
      i--;
      if (corps.length) sortie.push(...entete, ...corps, '');
    }
  }

  const titres = /^(#+) /;
  return sortie
    .filter((ligne, index, tout) => {
      const niveau = titres.exec(ligne)?.[1].length;
      if (!niveau) return true;
      const suite = tout.slice(index + 1).find((l) => l.trim() !== '');
      const niveauSuite = suite ? titres.exec(suite)?.[1].length : undefined;
      return suite !== undefined && (!niveauSuite || niveauSuite > niveau);
    })
    .join('\n')
    .trim();
};
