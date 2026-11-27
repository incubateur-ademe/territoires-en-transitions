/** La bibliothèque : une ligne par collectivité et contenu, référencée par son empreinte, ou par le nom de stockage T&C quand le fichier manque. */

import { toLegacyDocumentHash } from '@tet/domain/collectivites';
import { PoolClient } from 'pg';
import type { Contenu } from './archive';
import type { Fichier } from './fichiers';

// La trace des lignes créées par l'import des pièces des fiches porte le nom de la table seul.
export const TRACE_BIBLIOTHEQUE = 'bibliotheque_fichier_dossiers';

/** Un fichier à inscrire chez une collectivité : celle du dossier, ou l'émetteur pour le PDF d'un avis. */
export type Depot = {
  collectiviteId: number;
  fichier: Pick<Fichier, 'tecId' | 'chemin' | 'nom' | 'reference'>;
  contenu: Contenu | undefined;
  confidentiel: boolean;
};

export type Bibliotheque = Awaited<ReturnType<typeof createFichiers>>;

const toReference = (d: Pick<Depot, 'fichier' | 'contenu'>) =>
  d.contenu?.empreinte ?? toLegacyDocumentHash(d.fichier.reference);

const toCle = (collectiviteId: number, reference: string) =>
  `${collectiviteId}|${reference}`;

/** Inscrit chaque contenu dans la bibliothèque de sa collectivité, ligne réutilisée si elle existe ; confidentiel chez l'émetteur d'un avis. */
export const createFichiers = async (
  client: PoolClient,
  depots: readonly Depot[]
) => {
  const parCle = new Map<string, Depot & { reference: string }>();
  for (const d of depots) {
    const cle = toCle(d.collectiviteId, toReference(d));
    if (!parCle.has(cle)) {
      parCle.set(cle, { ...d, reference: toReference(d) });
    }
  }
  const voulus = [...parCle.values()];
  const { rows } = await client.query<{
    id: number;
    collectiviteId: number;
    reference: string;
    cree: boolean;
  }>(
    `with voulus as (
       select * from unnest($1::int[], $2::text[], $3::text[], $4::boolean[])
                  as v(collectivite_id, hash, filename, confidentiel)
     ), nouveaux as (
       insert into labellisation.bibliotheque_fichier
         (collectivite_id, hash, filename, confidentiel)
       select collectivite_id, hash, filename, confidentiel from voulus
       on conflict (collectivite_id, hash) do nothing
       returning id, collectivite_id, hash
     ), trace as (
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select $5, id from nouveaux
     ), marquees as (
       update labellisation.bibliotheque_fichier b set confidentiel = true
         from voulus v
        where v.confidentiel and b.collectivite_id = v.collectivite_id
          and b.hash = v.hash and not b.confidentiel
     )
     select id, collectivite_id as "collectiviteId", hash as reference, true as cree
       from nouveaux
     union all
     select b.id, b.collectivite_id, b.hash, false
       from labellisation.bibliotheque_fichier b
       join voulus v using (collectivite_id, hash)`,
    [
      voulus.map((v) => v.collectiviteId),
      voulus.map((v) => v.reference),
      voulus.map((v) => v.fichier.nom),
      voulus.map((v) => v.confidentiel),
      TRACE_BIBLIOTHEQUE,
    ]
  );
  const ids = new Map(
    rows.map((r) => [toCle(r.collectiviteId, r.reference), r.id])
  );

  return {
    /** L'id de la ligne de bibliothèque qui porte ce fichier chez cette collectivité. */
    getId: (d: Pick<Depot, 'collectiviteId' | 'fichier' | 'contenu'>) => {
      const id = ids.get(toCle(d.collectiviteId, toReference(d)));
      if (id === undefined) {
        throw new Error(
          `Fichier T&C ${d.fichier.tecId} absent de la bibliothèque de la collectivité ${d.collectiviteId}.`
        );
      }
      return id;
    },
    creees: rows.filter((r) => r.cree).length,
    reutilisees: rows.filter((r) => !r.cree).length,
  };
};
