export type SectionDeRegle = { numero: number; titre: string; texte: string };

export const splitRegles = (markdown: string): SectionDeRegle[] =>
  markdown.split(/^(?=## \d+\. )/m).flatMap((bloc) => {
    const entete = bloc.match(/^## (\d+)\. (.+)$/m);
    if (!entete) {
      return [];
    }
    return [
      {
        numero: Number(entete[1]),
        titre: entete[2].trim(),
        texte: bloc.slice(entete[0].length).trim(),
      },
    ];
  });
