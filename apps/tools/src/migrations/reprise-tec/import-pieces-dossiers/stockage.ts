/** Le stockage des fichiers : le bucket de la collectivité, un objet par empreinte, déposé comme le fait le produit. */

import { createClient } from '@supabase/supabase-js';
import { lookup } from 'mime-types';
import { PoolClient } from 'pg';
import { readOctets } from './archive';
import type { Depot } from './bibliotheque';

const ENVOIS_EN_PARALLELE = 4;

const getVariable = (nom: string) => {
  const valeur = process.env[nom];
  if (!valeur) {
    throw new Error(`${nom} est requis pour déposer les fichiers.`);
  }
  return valeur;
};

/** Le client du stockage, avec la clé de service. */
export const getStockage = () =>
  createClient(
    getVariable('SUPABASE_URL'),
    getVariable('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } }
  );

/** Envoie une fois chaque contenu dans le bucket de sa collectivité, nommé par son empreinte, en `upsert` comme `saveInStorage`. */
export const uploadFichiers = async (
  client: PoolClient,
  archive: string,
  depots: readonly Depot[]
) => {
  const stockage = getStockage();
  const { rows } = await client.query<{
    collectiviteId: number;
    bucketId: string;
  }>(
    `select collectivite_id as "collectiviteId", bucket_id as "bucketId"
       from public.collectivite_bucket`
  );
  const buckets = new Map(rows.map((r) => [r.collectiviteId, r.bucketId]));

  const aEnvoyer = [
    ...new Map(
      depots.flatMap((d) =>
        d.contenu
          ? [[`${d.collectiviteId}|${d.contenu.empreinte}`, d] as const]
          : []
      )
    ).values(),
  ];
  let octetsEnvoyes = 0;
  const envoyer = async () => {
    for (let p = aEnvoyer.shift(); p; p = aEnvoyer.shift()) {
      const bucket = buckets.get(p.collectiviteId);
      if (!bucket || !p.contenu) {
        throw new Error(
          `Pas de bucket pour la collectivité ${p.collectiviteId}.`
        );
      }
      const { error } = await stockage.storage
        .from(bucket)
        .upload(p.contenu.empreinte, await readOctets(archive, p.fichier), {
          // un PDF sans « .pdf » dans son nom reste un PDF pour le produit
          contentType: p.contenu.estPdf
            ? 'application/pdf'
            : lookup(p.fichier.nom) || 'application/octet-stream',
          upsert: true,
        });
      if (error) {
        throw new Error(
          `Envoi de « ${p.fichier.nom} » (T&C ${p.fichier.tecId}) refusé : ${error.message}`
        );
      }
      octetsEnvoyes += p.contenu.taille;
    }
  };
  const total = aEnvoyer.length;
  await Promise.all(Array.from({ length: ENVOIS_EN_PARALLELE }, envoyer));
  return { fichiers: total, octets: octetsEnvoyes };
};

/** Garde, appelée par `gardes.ts` : une collectivité ou un émetteur qui doit recevoir un fichier n'a pas de bucket. */
export const listCasBloquantsStockage = async (
  client: PoolClient,
  depots: readonly Depot[]
) => {
  const { rows } = await client.query<{ id: number; nom: string }>(
    `select c.id, c.nom from public.collectivite c
      where c.id = any($1)
        and not exists (select from public.collectivite_bucket b
                         where b.collectivite_id = c.id)
      order by c.id`,
    [[...new Set(depots.filter((d) => d.contenu).map((d) => d.collectiviteId))]]
  );
  return rows.map(
    (r) =>
      `  collectivité sans bucket : ${r.nom} (${r.id}), ses fichiers n'ont pas où aller`
  );
};
