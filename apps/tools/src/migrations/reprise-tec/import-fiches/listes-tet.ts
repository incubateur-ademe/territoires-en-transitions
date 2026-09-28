/** Les listes de TeT où l'import puise, résolues par libellé : les numéros changent d'une base à l'autre, et `thematique` a des lignes techniques. */

import { PoolClient } from 'pg';
import { type Classement, SECTEURS, translate, VOLETS } from './listes-tec';

/** Le type de tout plan repris : « Plan Climat Air Énergie Territorial », parmi les plans transverses. */
const TYPE_PLAN = {
  categorie: 'Plans transverses',
  type: 'Plan Climat Air Énergie Territorial',
};

export type ListesTet = Awaited<ReturnType<typeof loadListesTet>>;

/** Lit les listes de TeT et rend de quoi traduire un volet ou un secteur ; arrête si un libellé ne se résout pas. */
export const loadListesTet = async (client: PoolClient) => {
  const {
    rows: [typePlan],
  } = await client.query<{ id: number }>(
    `select id from public.plan_action_type where categorie = $1 and type = $2`,
    [TYPE_PLAN.categorie, TYPE_PLAN.type]
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

  const resolveClassement = (
    classement: Classement
  ): { thematiqueId: number; sousThematiqueId: number | null } => {
    if (classement.sousThematique === undefined) {
      return {
        thematiqueId: getId(thematiques, classement.thematique),
        sousThematiqueId: null,
      };
    }
    const libelle = classement.sousThematique;
    const sousThematique = getUnique(
      sousThematiques.filter((s) => s.libelle === libelle),
      libelle
    );
    return {
      thematiqueId: sousThematique.thematiqueId,
      sousThematiqueId: sousThematique.id,
    };
  };
  const classements = new Map(
    [...SECTEURS].map(([secteur, c]) => [secteur, resolveClassement(c)])
  );

  return {
    typePlanId: getUnique(typePlan ? [typePlan] : [], TYPE_PLAN.type).id,

    /** L'effet attendu d'un volet de T&C. */
    getEffetId: (volet: number) =>
      getId(effets, translate(VOLETS, volet, 'volet')),

    /** La thématique, et la sous-thématique s'il y en a une, d'un secteur de T&C. */
    getClassement: (secteur: number) =>
      translate(classements, secteur, 'secteur'),
  };
};

type Libelle = { id: number; libelle: string };

/** Le numéro de la seule ligne qui porte ce libellé. */
const getId = (lignes: readonly Libelle[], libelle: string) =>
  getUnique(
    lignes.filter((l) => l.libelle === libelle),
    libelle
  ).id;

const getUnique = <T>(trouvees: readonly T[], libelle: string): T => {
  if (trouvees.length !== 1) {
    throw new Error(
      `« ${libelle} » : ${trouvees.length} lignes dans TeT, une attendue.`
    );
  }
  return trouvees[0];
};
