/** Les tags d'une collectivité (structures pilotes, tags personnalisés) : un par nom, réutilisé s'il existe, créé une seule fois sinon. */

import { PoolClient } from 'pg';
import type { Fiche } from './fiches';

export type TableTag = 'structure_tag' | 'libre_tag';

export type Tags = Awaited<ReturnType<typeof createTags>>;

/** Crée les tags qui manquent aux fiches ; rend leur id et le nombre de réutilisés et de créés. */
export const createTags = async (
  client: PoolClient,
  fiches: readonly Fiche[]
) => {
  const structures = await createTagsDeTable(
    client,
    'structure_tag',
    fiches.flatMap((f) =>
      f.structures.map((nom) => ({
        collectiviteId: f.dossier.collectiviteId,
        nom,
      }))
    )
  );
  const libres = await createTagsDeTable(
    client,
    'libre_tag',
    fiches.flatMap((f) =>
      f.tagsLibres.map((nom) => ({
        collectiviteId: f.dossier.collectiviteId,
        nom,
      }))
    )
  );
  const ids = { structure_tag: structures.ids, libre_tag: libres.ids };

  return {
    /** L'id du tag qui porte ce nom dans la collectivité. */
    getId: (table: TableTag, collectiviteId: number, nom: string) => {
      const id = ids[table].get(toCle({ collectiviteId, nom }));
      if (id === undefined) {
        throw new Error(
          `${table} « ${nom} » absent de la collectivité ${collectiviteId}.`
        );
      }
      return id;
    },
    comptes: {
      structure_tag: structures.comptes,
      libre_tag: libres.comptes,
    },
  };
};

type Tag = { collectiviteId: number; nom: string };

const toCle = ({ collectiviteId, nom }: Tag) => `${collectiviteId}|${nom}`;

/**
 * Crée les tags manquants d'une table et leur trace ; rend aussi ceux qui existaient déjà.
 * Le dernier `select` ne voit pas ce que la même requête insère : il ne rend que les tags d'avant.
 */
const createTagsDeTable = async (
  client: PoolClient,
  table: TableTag,
  demandes: readonly Tag[]
) => {
  const voulus = [...new Map(demandes.map((t) => [toCle(t), t])).values()];
  const { rows } = await client.query<Tag & { id: number; cree: boolean }>(
    `with voulus as (
       select * from unnest($1::int[], $2::text[]) as v(collectivite_id, nom)
     ), nouveaux as (
       insert into public.${table} (collectivite_id, nom, created_by)
       select collectivite_id, nom, null from voulus
       on conflict (nom, collectivite_id) do nothing
       returning id, collectivite_id, nom
     ), trace as (
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select $3, id from nouveaux
     )
     select id, collectivite_id as "collectiviteId", nom, true as cree
       from nouveaux
     union all
     select t.id, t.collectivite_id, t.nom, false
       from public.${table} t
       join voulus v using (collectivite_id, nom)`,
    [voulus.map((t) => t.collectiviteId), voulus.map((t) => t.nom), table]
  );
  const crees = rows.filter((t) => t.cree).length;

  return {
    ids: new Map(rows.map((t) => [toCle(t), t.id])),
    comptes: { reutilises: rows.length - crees, crees },
  };
};
