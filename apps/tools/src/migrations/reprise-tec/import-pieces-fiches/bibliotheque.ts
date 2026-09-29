/** La bibliothèque de la collectivité : une ligne par pièce, référencée par son nom de stockage T&C, sans le fichier. */

import { toLegacyDocumentHash } from '@tet/domain/collectivites';
import { PoolClient } from 'pg';
import type { Fichier } from './pieces';

export type Bibliotheque = Awaited<ReturnType<typeof createFichiers>>;

type Reference = Pick<Fichier, 'collectiviteId' | 'reference'>;

const toCle = ({ collectiviteId, reference }: Reference) =>
  `${collectiviteId}|${reference}`;

/**
 * Inscrit chaque pièce dans la bibliothèque de sa collectivité, pour que l'annexe y pointe ; rend `getId` et les comptes.
 * Une ligne qui existe déjà est réutilisée sans trace : l'annulation ne la retire pas.
 */
export const createFichiers = async (
  client: PoolClient,
  fichiers: readonly Fichier[]
) => {
  const voulus = [
    ...new Map(
      fichiers.map((f) => [
        toCle(f),
        { ...f, reference: toLegacyDocumentHash(f.reference) },
      ])
    ).values(),
  ];
  const { rows } = await client.query<
    Reference & { id: number; cree: boolean }
  >(
    `with voulus as (
       select * from unnest($1::int[], $2::text[], $3::text[])
                  as v(collectivite_id, hash, filename)
     ), nouveaux as (
       insert into labellisation.bibliotheque_fichier
         (collectivite_id, hash, filename, confidentiel)
       select collectivite_id, hash, filename, false from voulus
       on conflict (collectivite_id, hash) do nothing
       returning id, collectivite_id, hash
     ), trace as (
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select 'bibliotheque_fichier', id from nouveaux
     )
     select id, collectivite_id as "collectiviteId", hash as reference, true as cree
       from nouveaux
     union all
     select b.id, b.collectivite_id, b.hash, false
       from labellisation.bibliotheque_fichier b
       join voulus v using (collectivite_id, hash)`,
    [
      voulus.map((f) => f.collectiviteId),
      voulus.map((f) => f.reference),
      voulus.map((f) => f.nom),
    ]
  );
  const ids = new Map(rows.map((r) => [toCle(r), r.id]));
  const crees = rows.filter((r) => r.cree).length;

  return {
    /** L'id de la ligne de bibliothèque qui porte cette pièce. */
    getId: (f: Reference) => {
      const id = ids.get(toCle(f));
      if (id === undefined) {
        throw new Error(
          `Référence ${f.reference} absente de la bibliothèque de la collectivité ${f.collectiviteId}.`
        );
      }
      return id;
    },
    comptes: { reutilisees: rows.length - crees, creees: crees },
  };
};
