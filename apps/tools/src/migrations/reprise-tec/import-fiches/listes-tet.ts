/** Les listes de TeT où l'import puise, résolues par libellé : les numéros changent d'une base à l'autre, et `thematique` a des lignes techniques. */

import { PoolClient } from 'pg';
import { SECTEURS, translate, VOLETS } from './listes-tec';

/** Le type de tout plan repris : « Plan Climat Air Énergie Territorial », parmi les plans transverses. */
const TYPE_PLAN = {
  categorie: 'Plans transverses',
  type: 'Plan Climat Air Énergie Territorial',
};

export type ListesTet = Awaited<ReturnType<typeof loadListesTet>>;

/** Lit les listes de TeT et rend de quoi traduire un volet ou un secteur de T&C, et les libellés introuvables. */
export const loadListesTet = async (client: PoolClient) => {
  const { rows: typesPlan } = await client.query<Libelle>(
    `select id, type as libelle from public.plan_action_type where categorie = $1`,
    [TYPE_PLAN.categorie]
  );
  const { rows: effets } = await client.query<Libelle>(
    `select id, nom as libelle from public.effet_attendu`
  );
  const { rows: thematiques } = await client.query<Libelle>(
    `select id, nom as libelle from public.thematique`
  );
  const { rows: sousThematiques } = await client.query<
    Libelle & { thematiqueId: number }
  >(`select id, sous_thematique as libelle, thematique_id as "thematiqueId"
        from public.sous_thematique`);

  const casBloquants: string[] = [];
  // Un libellé introuvable donne -1, jamais écrit : la garde arrête l'import avant.
  const find = <T extends Libelle>(
    lignes: readonly T[],
    libelle: string,
    liste: string
  ) => {
    const trouvees = lignes.filter((l) => l.libelle === libelle);
    if (trouvees.length !== 1) {
      casBloquants.push(
        `  ${liste} « ${libelle} » : ${trouvees.length} ligne(s) dans TeT, une attendue`
      );
    }
    return trouvees.length === 1 ? trouvees[0] : null;
  };

  const typePlanId = find(typesPlan, TYPE_PLAN.type, 'type de plan')?.id ?? -1;
  const effetIds = new Map(
    [...VOLETS].map(([volet, libelle]) => [
      volet,
      find(effets, libelle, 'effet attendu')?.id ?? -1,
    ])
  );
  const classements = new Map<number, ClassementTet>(
    [...SECTEURS].map(([secteur, c]) => {
      if (c.sousThematique === undefined) {
        const thematiqueId = find(thematiques, c.thematique, 'thématique')?.id;
        return [
          secteur,
          {
            thematiqueId: thematiqueId ?? -1,
            sousThematiqueId: null,
            thematiqueExacte: c.exacte === true,
          },
        ];
      }
      const sousThematique = find(
        sousThematiques,
        c.sousThematique,
        'sous-thématique'
      );
      return [
        secteur,
        {
          thematiqueId: sousThematique?.thematiqueId ?? -1,
          sousThematiqueId: sousThematique?.id ?? -1,
          thematiqueExacte: false,
        },
      ];
    })
  );

  return {
    typePlanId,

    /** L'effet attendu d'un volet de T&C. */
    getEffetId: (volet: number) => translate(effetIds, volet, 'volet'),

    /** La thématique, et la sous-thématique s'il y en a une, d'un secteur de T&C. */
    getClassement: (secteur: number) =>
      translate(classements, secteur, 'secteur'),

    /** Garde, appelée par `gardes.ts` : un libellé introuvable dans TeT, ou porté par plusieurs lignes. */
    listCasBloquants: () => [...new Set(casBloquants)],
  };
};

type ClassementTet = {
  thematiqueId: number;
  sousThematiqueId: number | null;
  // la thématique dit déjà tout du secteur : pas de filtre perdu sans sous-thématique
  thematiqueExacte: boolean;
};

type Libelle = { id: number; libelle: string };
