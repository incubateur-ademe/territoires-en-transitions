/** Les thématiques TeT : celle de chaque libellé T&C, et la « Déchets » des collectivités. */

import { PoolClient } from 'pg';
import type { Valeur } from './fusion';
import { LIBELLES } from './libelles';

export type Thematique = { code: string } | { label: string };

/** Met un libellé sous la forme de la table : minuscules, espaces réduits, apostrophe droite. */
const toForme = (libelle: string) =>
  libelle.replace(/’/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();

/** La thématique TeT d'un libellé T&C, `null` s'il n'est pas dans la table. */
export const findThematique = (libelle: string | null) =>
  LIBELLES.get(toForme(libelle ?? '')) ?? null;

/** Les id des thématiques du socle, par code. */
export const loadThematiquesDuSocle = async (client: PoolClient) => {
  const { rows } = await client.query<{ code: string; id: number }>(
    `select code, id from public.demarche_pcaet_vulnerabilite_thematique
      where collectivite_id is null`
  );
  return new Map(rows.map((r) => [r.code, r.id]));
};

/** Les collectivités dont une ligne « Déchets » est à écrire : un objectif, ou un niveau fort, moyen ou faible. */
export const listCollectivitesAvecDechets = (valeurs: readonly Valeur[]) =>
  valeurs.flatMap(({ aEcrire, collectiviteId, thematique }) =>
    aEcrire && 'label' in thematique
      ? [{ collectiviteId, label: thematique.label }]
      : []
  );

/** Crée « Déchets » dans chaque collectivité qui ne l'a pas (non requise, sans auteur) ; si elle y est, la réutilise sans la tracer. */
export const createThematiquesDechets = async (
  client: PoolClient,
  voulues: readonly { collectiviteId: number; label: string }[]
) => {
  const { rows } = await client.query<{
    collectiviteId: number;
    label: string;
    id: number;
    creee: boolean;
  }>(
    `with voulues as (
       select distinct * from unnest($1::int[], $2::text[]) as v(collectivite_id, label)
     ), existantes as (
       select t.collectivite_id, v.label, t.id
         from public.demarche_pcaet_vulnerabilite_thematique t
         join voulues v
           on v.collectivite_id = t.collectivite_id and lower(v.label) = lower(t.label)
        where t.parent_id is null
     ), creees as (
       insert into public.demarche_pcaet_vulnerabilite_thematique
         (code, label, collectivite_id, parent_id, requis, display_order, created_by, modified_by)
       select null, v.label, v.collectivite_id, null, false,
              (select greatest(coalesce(max(d.display_order), 0) + 1, 1000)
                 from public.demarche_pcaet_vulnerabilite_thematique d
                where d.collectivite_id = v.collectivite_id),
              null, null
         from voulues v
        where not exists (select from existantes e
                           where e.collectivite_id = v.collectivite_id and e.label = v.label)
        order by v.collectivite_id, v.label
       returning collectivite_id, label, id
     ), trace as (
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select 'demarche_pcaet_vulnerabilite_thematique', id from creees
     )
     select collectivite_id as "collectiviteId", label, id, true as creee from creees
     union all
     select collectivite_id, label, id, false from existantes`,
    [voulues.map((v) => v.collectiviteId), voulues.map((v) => v.label)]
  );
  const ids = new Map(
    rows.map((r) => [`${r.collectiviteId}|${r.label}`, r.id])
  );
  return {
    getId: (collectiviteId: number, label: string) =>
      ids.get(`${collectiviteId}|${label}`),
    creees: rows.filter((r) => r.creee).length,
    reutilisees: rows.filter((r) => !r.creee).length,
  };
};
