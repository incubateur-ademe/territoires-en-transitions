/** L'écriture des fiches, de leurs liens et de leurs notes, et leur trace pour l'annulation. */

import { PoolClient } from 'pg';
import type { Fiche } from './fiches';
import type { Tags } from './tags';

/** Le compte système « Territoires en Transition », auteur des notes reprises. */
export const COMPTE_SYSTEME = '00000000-0000-0000-0000-000000000001';

/**
 * Réserve des ids dans le compteur de la table, pour savoir quelle ligne de TeT vient de quelle ligne de T&C.
 * Une insertion ne rend pas ses lignes dans un ordre garanti.
 */
export const reserveIds = async (
  client: PoolClient,
  table: 'axe' | 'fiche_action',
  nombre: number
) => {
  const { rows } = await client.query<{ id: number }>(
    `select nextval(pg_get_serial_sequence($1, 'id'))::int as id
       from generate_series(1, $2)`,
    [`public.${table}`, nombre]
  );
  return rows.map((r) => r.id).sort((a, b) => a - b);
};

/** Écrit les fiches dans le plan de leur dossier, avec leurs liens et leurs notes ; rend leur nombre. */
export const createFiches = async (
  client: PoolClient,
  fiches: readonly Fiche[],
  planIds: ReadonlyMap<number, number>,
  tags: Tags
) => {
  const ids = await reserveIds(client, 'fiche_action', fiches.length);
  const avecId = fiches.map((f, i) => ({ ...f, id: ids[i] }));

  const { rowCount } = await client.query(
    `insert into public.fiche_action
       (id, titre, description, statut, date_debut, cibles, collectivite_id,
        created_at, modified_at, created_by, modified_by, deleted)
     select f.id, f.titre, f.description, f.statut::fiche_action_statuts,
            f.date_debut, (select array_agg(c) from jsonb_array_elements_text(f.cibles) c),
            f.collectivite_id, f.created_at, f.created_at, null, null, false
       from unnest($1::int[], $2::text[], $3::text[], $4::text[],
                   $5::timestamptz[], $6::jsonb[], $7::int[], $8::timestamptz[])
              as f(id, titre, description, statut, date_debut, cibles,
                   collectivite_id, created_at)`,
    [
      avecId.map((f) => f.id),
      avecId.map((f) => f.colonnes.titre),
      avecId.map((f) => f.colonnes.description),
      avecId.map((f) => f.colonnes.statut),
      avecId.map((f) => f.colonnes.dateDebut),
      avecId.map((f) =>
        f.colonnes.cibles === null ? null : JSON.stringify(f.colonnes.cibles)
      ),
      avecId.map((f) => f.colonnes.collectiviteId),
      avecId.map((f) => f.colonnes.createdAt),
    ]
  );

  const liens: [table: string, colonne: string, paires: number[][]][] = [
    [
      'fiche_action_axe',
      'axe_id',
      avecId.map((f) => [f.id, getPlanId(planIds, f)]),
    ],
    [
      'fiche_action_effet_attendu',
      'effet_attendu_id',
      avecId.flatMap((f) => f.effetIds.map((e) => [f.id, e])),
    ],
    [
      'fiche_action_thematique',
      'thematique_id',
      avecId.flatMap((f) => f.thematiqueIds.map((t) => [f.id, t])),
    ],
    [
      'fiche_action_sous_thematique',
      'thematique_id',
      avecId.flatMap((f) => f.sousThematiqueIds.map((t) => [f.id, t])),
    ],
    [
      'fiche_action_structure_tag',
      'structure_tag_id',
      avecId.flatMap((f) =>
        f.structures.map((nom) => [
          f.id,
          tags.getId('structure_tag', f.colonnes.collectiviteId, nom),
        ])
      ),
    ],
    [
      'fiche_action_libre_tag',
      'libre_tag_id',
      avecId.flatMap((f) =>
        f.tagsLibres.map((nom) => [
          f.id,
          tags.getId('libre_tag', f.colonnes.collectiviteId, nom),
        ])
      ),
    ],
  ];
  // Les liens partent avec la fiche à l'annulation : ils ne sont pas tracés.
  for (const [table, colonne, paires] of liens) {
    await client.query(
      `insert into public.${table} (fiche_id, ${colonne})
       select * from unnest($1::int[], $2::int[])`,
      [paires.map(([fiche]) => fiche), paires.map(([, autre]) => autre)]
    );
  }
  await createNotes(client, avecId);

  await client.query(
    `with correspondance as (
       insert into reprise_tec.correspondance (table_cible, tec_id, tet_id)
       select 'fiche_action', tec_id, id from unnest($1::int[], $2::int[]) as f(tec_id, id)
     )
     insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
     select 'fiche_action', id from unnest($2::int[]) as id`,
    [avecId.map((f) => f.tecId), avecId.map((f) => f.id)]
  );
  return rowCount ?? 0;
};

/** Écrit les notes au nom du compte système, datées de la création de l'action dans T&C. */
const createNotes = async (
  client: PoolClient,
  fiches: readonly (Fiche & { id: number })[]
) => {
  const notes = fiches.flatMap((f) =>
    f.notes.map((note) => ({
      ficheId: f.id,
      note,
      creeeLe: f.colonnes.createdAt,
    }))
  );
  await client.query(
    `with notes as (
       insert into public.fiche_action_note
         (fiche_id, date_note, note, created_at, modified_at, created_by, modified_by)
       select fiche_id, (cree_le at time zone 'Europe/Paris')::date, note,
              cree_le, cree_le, $4, $4
         from unnest($1::int[], $2::text[], $3::timestamptz[])
                as n(fiche_id, note, cree_le)
       returning id
     )
     insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
     select 'fiche_action_note', id from notes`,
    [
      notes.map((n) => n.ficheId),
      notes.map((n) => n.note),
      notes.map((n) => n.creeeLe),
      COMPTE_SYSTEME,
    ]
  );
};

const getPlanId = (planIds: ReadonlyMap<number, number>, f: Fiche) => {
  const id = planIds.get(f.dossier.tecId);
  if (id === undefined) {
    throw new Error(`Aucun plan pour le dossier T&C ${f.dossier.tecId}.`);
  }
  return id;
};

/** Garde, appelée par `gardes.ts` : sans le compte système, aucune note ne peut s'écrire (auteur obligatoire). */
export const listCasBloquantsEcriture = async (client: PoolClient) => {
  const {
    rows: [compte],
  } = await client.query<{ existe: boolean; nom: string | null }>(
    `select exists (select from auth.users where id = $1) as existe,
            (select nom from public.dcp where user_id = $1) as nom`,
    [COMPTE_SYSTEME]
  );
  return [
    ...(compte.existe
      ? []
      : [
          `  compte système ${COMPTE_SYSTEME} absent : les notes ne peuvent pas s'écrire`,
        ]),
    ...(compte.existe && compte.nom === null
      ? [
          `  compte système ${COMPTE_SYSTEME} sans nom : les notes seraient anonymes`,
        ]
      : []),
  ];
};
