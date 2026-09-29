/** Les annexes, qui accrochent à une fiche soit un fichier de la bibliothèque, soit un lien ; et « Modifié le » des fiches gardé. */

import { PoolClient } from 'pg';
import type { Bibliotheque } from './bibliotheque';
import type { Fichier } from './pieces';
import type { UrlSiteWebValide } from './url-site-web';

/** Le compte « Territoires & Climat », auteur des annexes reprises. */
export const COMPTE_TERRITOIRES_CLIMAT = '00000000-0000-0000-0000-000000000002';

/** Écrit une annexe par fichier et par « site web », au nom de « Territoires & Climat », datée de la création de l'action, et leur trace. */
export const createAnnexes = async (
  client: PoolClient,
  fichiers: readonly Fichier[],
  urlsSiteWeb: readonly UrlSiteWebValide[],
  bibliotheque: Bibliotheque
) => {
  const annexes = [
    ...fichiers.map((f) => ({
      ...f,
      fichierId: bibliotheque.getId(f),
      lien: null,
    })),
    ...urlsSiteWeb.map((u) => ({ ...u, fichierId: null })),
  ];
  const { rows } = await client.query<{ nombre: number }>(
    `with annexes as (
       insert into public.annexe
         (collectivite_id, fiche_id, fichier_id, url, titre, modified_by, modified_at)
       select collectivite_id, fiche_id, fichier_id, url, coalesce(titre, ''),
              $7, modified_at
         from unnest($1::int[], $2::int[], $3::int[], $4::text[], $5::text[],
                     $6::timestamptz[])
                as a(collectivite_id, fiche_id, fichier_id, url, titre, modified_at)
       returning id
     ), trace as (
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select 'annexe', id from annexes
     )
     select count(*)::int as nombre from annexes`,
    [
      annexes.map((a) => a.collectiviteId),
      annexes.map((a) => a.ficheId),
      annexes.map((a) => a.fichierId),
      annexes.map((a) => a.lien?.url ?? null),
      annexes.map((a) => a.lien?.titre ?? null),
      annexes.map((a) => a.creeeLe),
      COMPTE_TERRITOIRES_CLIMAT,
    ]
  );
  if (rows[0].nombre !== annexes.length) {
    throw new Error(
      `${annexes.length} annexes calculées, ${rows[0].nombre} écrites : rien n'est validé.`
    );
  }
};

/**
 * Lance `ecrire`, puis remet « Modifié le » et son auteur tels qu'ils étaient : le produit les met au jour même à chaque annexe.
 */
export const keepModifieLe = async <T>(
  client: PoolClient,
  ficheIds: readonly number[],
  ecrire: () => Promise<T>
) => {
  const { rows: avant } = await client.query<{
    id: number;
    modifiedAt: string;
    modifiedBy: string | null;
  }>(
    `select id, modified_at::text as "modifiedAt", modified_by as "modifiedBy"
       from public.fiche_action where id = any($1)`,
    [[...new Set(ficheIds)]]
  );
  const resultat = await ecrire();
  await client.query(
    `update public.fiche_action f
        set modified_at = a.modified_at, modified_by = a.modified_by
       from unnest($1::int[], $2::timestamptz[], $3::uuid[])
              as a(id, modified_at, modified_by)
      where f.id = a.id`,
    [
      avant.map((f) => f.id),
      avant.map((f) => f.modifiedAt),
      avant.map((f) => f.modifiedBy),
    ]
  );
  return resultat;
};

/** Garde, appelée par `gardes.ts` : l'import est déjà passé, ou le compte « Territoires & Climat » manque ou n'a pas de nom. */
export const listCasBloquantsEcriture = async (client: PoolClient) => {
  const {
    rows: [etat],
  } = await client.query<{
    annexes: number;
    compteExiste: boolean;
    nom: string | null;
  }>(
    `select (select count(*) from reprise_tec.lignes_ecrites
              where table_cible = 'annexe')::int as annexes,
            exists (select from auth.users where id = $1) as "compteExiste",
            (select nullif(trim(nom), '') from public.dcp where user_id = $1) as nom`,
    [COMPTE_TERRITOIRES_CLIMAT]
  );
  return [
    ...(etat.annexes > 0
      ? [
          `  ${etat.annexes} annexes déjà écrites par la reprise : l'import des pièces est déjà passé (l'annuler d'abord)`,
        ]
      : []),
    ...(etat.compteExiste
      ? []
      : [
          `  compte « Territoires & Climat » ${COMPTE_TERRITOIRES_CLIMAT} absent : les annexes exigent un auteur`,
        ]),
    ...(etat.compteExiste && etat.nom === null
      ? [
          `  compte « Territoires & Climat » ${COMPTE_TERRITOIRES_CLIMAT} sans nom : les annexes s'afficheraient sans auteur`,
        ]
      : []),
  ];
};
