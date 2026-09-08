export const MAX_TITRE_LENGTH = 300;
export const MAX_DESCRIPTION_LENGTH = 2000;

/**
 * Liste blanche, et non liste noire : la classe est niée, donc tout ce qui
 * n'est pas explicitement autorisé est rejeté. Une liste noire se raisonne par
 * ce qu'on a pensé à interdire, et le jeu des caractères Unicode capables de
 * simuler une structure de prompt est ouvert.
 *
 * Ce qui reste : lettres et chiffres de toutes les écritures (\p{L}, \p{N}),
 * espaces (\p{Zs}), apostrophes droite et typographique, ponctuation courante,
 * et les signes qui portent du sens dans une fiche — pourcentages, degrés,
 * euros, parenthèses, tirets d'intervalle.
 *
 * Ce qui tombe, et pourquoi c'est ce qui compte : les chevrons, sans lesquels
 * aucune balise `</action>` ne peut être forgée ; les accolades, qui
 * imiteraient un placeholder du moteur de template ; les dièses, astérisques,
 * soulignés et signes égal, qui imiteraient un titre ou un séparateur markdown ;
 * les caractères de contrôle, séquences ANSI, zéro-largeur et marques de
 * réordonnancement bidirectionnel ; et tous les sauts de ligne, y compris ceux
 * que `\s` ignore en JavaScript (U+0085, U+2028, U+2029).
 */
const DISALLOWED_CHARACTERS = /[^\p{L}\p{N}\p{Zs}'’,.;:!?%°€/+()\-–—]/gu;

export type FicheToClassify = {
  ficheId: number;
  titre: string;
  description: string | null;
};

export type RenderedFiche = {
  index: number;
  ficheId: number;
  isDescriptionTruncated: boolean;
};

export type FichesRendering = {
  text: string;
  rendered: RenderedFiche[];
};

/**
 * Réduit le texte d'une fiche à de la donnée inerte, en trois passes ordonnées.
 *
 * 1. Tout caractère hors liste blanche devient une espace — plutôt que d'être
 *    supprimé, pour que `a<b` ne se recolle pas en un mot `ab` qui n'existait
 *    pas.
 * 2. Les suites d'au moins deux tirets deviennent une espace. Le tiret isolé
 *    est autorisé, parce qu'il porte du sens (`2026-2030`, `Saint-Denis`), mais
 *    une suite ne sert qu'à tracer un séparateur — `----`, `————`. C'est le
 *    seul caractère autorisé qui devient nuisible par répétition, d'où cette
 *    passe distincte.
 * 3. Les espaces consécutives, très majoritairement produites par les deux
 *    passes précédentes, sont ramenées à une seule, puis les bords sont coupés.
 *    En dernier, donc, pour absorber ce que les autres ont laissé.
 *
 * Le résultat tient sur une seule ligne : la liste blanche ne conserve aucun
 * saut de ligne, ce qui garantit qu'une fiche ne peut pas se donner l'allure de
 * plusieurs blocs dans le prompt.
 */
const sanitize = (value: string): string =>
  value
    .replace(DISALLOWED_CHARACTERS, ' ')
    .replace(/[-–—]{2,}/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

const truncate = (value: string, max: number): string => {
  const characters = Array.from(value);
  return characters.length > max
    ? `${characters.slice(0, max - 1).join('')}…`
    : value;
};

const renderFiche = (
  fiche: FicheToClassify,
  index: number,
  nonce: string
): { rendered: RenderedFiche; block: string } => {
  const titre = truncate(sanitize(fiche.titre), MAX_TITRE_LENGTH);
  const sanitizedDescription = sanitize(fiche.description ?? '');
  const description = truncate(sanitizedDescription, MAX_DESCRIPTION_LENGTH);

  return {
    rendered: {
      index,
      ficheId: fiche.ficheId,
      isDescriptionTruncated:
        Array.from(sanitizedDescription).length > MAX_DESCRIPTION_LENGTH,
    },
    block: [
      `<action index="${index}" nonce="${nonce}">`,
      titre,
      description,
      '</action>',
    ]
      .filter((line) => line.length > 0)
      .join('\n'),
  };
};

export const renderFichesText = (
  fiches: FicheToClassify[],
  nonce: string
): FichesRendering => {
  const renderings = fiches.map((fiche, index) =>
    renderFiche(fiche, index, nonce)
  );

  return {
    text: renderings.map(({ block }) => block).join('\n\n'),
    rendered: renderings.map(({ rendered }) => rendered),
  };
};
