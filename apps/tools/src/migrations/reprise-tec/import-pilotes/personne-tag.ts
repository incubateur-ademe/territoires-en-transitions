/** Les personne_tag : un nom sans compte par nom exact et par collectivité, le « tag » du produit ; réutilisé s'il existe. */

import { PoolClient } from 'pg';

export type PersonneTag = {
  collectiviteId: number;
  nom: string;
};

export type PersonneTags = Awaited<ReturnType<typeof createPersonneTags>>;

/** Le nom d'un utilisateur de T&C : « Prénom Nom » tel que saisi, espaces en trop réduits. */
export const buildNom = (prenom: string | null, nom: string | null) =>
  `${prenom ?? ''} ${nom ?? ''}`.replace(/\s+/g, ' ').trim();

/**
 * Crée le personne_tag de chaque nom absent de la collectivité ; si le nom y est déjà, prend la ligne existante
 * (l'annulation ne la retirera pas). Note pour chaque utilisateur T&C le personne_tag qu'il devient.
 * Le dernier `select` ne voit pas ce que la même requête insère : il ne rend que les personne_tag d'avant.
 */
export const createPersonneTags = async (
  client: PoolClient,
  utilisateurs: readonly (PersonneTag & { utilisateurId: number })[]
) => {
  const voulues = [...new Map(utilisateurs.map((u) => [toCle(u), u])).values()];
  const { rows } = await client.query<
    PersonneTag & { id: number; creee: boolean }
  >(
    `with voulues as (
       select * from unnest($1::int[], $2::text[]) as v(collectivite_id, nom)
     ), nouvelles as (
       insert into public.personne_tag (collectivite_id, nom, created_by)
       select collectivite_id, nom, null from voulues
       on conflict (nom, collectivite_id) do nothing
       returning id, collectivite_id, nom
     ), trace as (
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select 'personne_tag', id from nouvelles
     )
     select id, collectivite_id as "collectiviteId", nom, true as creee
       from nouvelles
     union all
     select p.id, p.collectivite_id, p.nom, false
       from public.personne_tag p
       join voulues v using (collectivite_id, nom)`,
    [voulues.map((p) => p.collectiviteId), voulues.map((p) => p.nom)]
  );
  const ids = new Map(rows.map((p) => [toCle(p), p.id]));
  const getId = (personne: PersonneTag) => {
    const id = ids.get(toCle(personne));
    if (id === undefined) {
      throw new Error(
        `personne_tag « ${personne.nom} » absent de la collectivité ${personne.collectiviteId}.`
      );
    }
    return id;
  };

  const correspondances = [
    ...new Map(
      utilisateurs.map((u) => {
        const tagId = getId(u);
        return [`${u.utilisateurId}|${tagId}`, { ...u, tagId }];
      })
    ).values(),
  ];
  await client.query(
    `insert into reprise_tec.correspondance (table_cible, tec_id, tet_id)
     select 'personne_tag', tec_id, tet_id
       from unnest($1::bigint[], $2::bigint[]) as c(tec_id, tet_id)`,
    [
      correspondances.map((c) => c.utilisateurId),
      correspondances.map((c) => c.tagId),
    ]
  );

  const creees = rows.filter((p) => p.creee).length;
  return { getId, creees, reutilisees: rows.length - creees };
};

const toCle = ({ collectiviteId, nom }: PersonneTag) =>
  `${collectiviteId}|${nom}`;

/** Garde, appelée par `gardes.ts` : un utilisateur T&C à nommer sans prénom ni nom ; le script n'invente pas de nom. */
export const listCasBloquantsNoms = (
  utilisateurs: readonly (PersonneTag & {
    utilisateurId: number;
    collectivite: string;
  })[]
) => [
  ...new Map(
    utilisateurs
      .filter((u) => u.nom === '')
      .map((u) => [
        u.utilisateurId,
        `  utilisateur T&C ${u.utilisateurId} sans prénom ni nom, pilote dans ${u.collectivite} : son personne_tag serait vide`,
      ])
  ).values(),
];
