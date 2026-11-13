/** Les pièces du dossier (cases, inclusions du PCAET global, documents additionnels), les avis rendus, et leur trace. */

import { PoolClient } from 'pg';
import type { AvisEcrit } from './avis';
import { TRACE_BIBLIOTHEQUE, type Bibliotheque } from './bibliotheque';
import { toDepot } from './pieces';
import type { Inclusion, Rangement } from './rangement';

/** Écrit chaque pièce rangée, sans déposant (T&C n'en garde pas), datée par sa rubrique ; rend le nombre d'inclusions écrites. */
export const createDocuments = async (
  client: PoolClient,
  rangements: readonly Rangement[],
  inclusions: readonly Inclusion[],
  bibliotheque: Bibliotheque
) => {
  const enCase = rangements.flatMap((r) => (r.niveau === 3 ? [] : [r]));
  const additionnels = rangements.filter((r) => r.niveau === 3);

  const cases = await client.query(
    `with documents as (
       insert into public.demarche_document
         (collectivite_id, demarche_id, document_id, etape, fichier_id, modified_at)
       select collectivite_id, demarche_id, document_id, etape, fichier_id,
              coalesce(modified_at, now())
         from unnest($1::int[], $2::int[], $3::text[], $4::text[], $5::int[],
                     $6::timestamptz[])
                as d(collectivite_id, demarche_id, document_id, etape, fichier_id, modified_at)
       returning id
     )
     insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
     select 'demarche_document', id from documents`,
    [
      enCase.map((r) => r.piece.fichier.collectiviteId),
      enCase.map((r) => r.piece.fichier.demarcheId),
      enCase.map((r) => r.documentId),
      enCase.map((r) => r.etape),
      enCase.map((r) => bibliotheque.getId(toDepot(r.piece))),
      enCase.map((r) => r.piece.date),
    ]
  );

  // Après les cases : une pièce qui a son propre fichier garde sa ligne, comme dans l'app.
  const cochees = await client.query(
    `with inclusions as (
       insert into public.demarche_document
         (collectivite_id, demarche_id, document_id, etape, modified_at)
       select collectivite_id, demarche_id, document_id, 'amont',
              coalesce(modified_at, now())
         from unnest($1::int[], $2::int[], $3::text[], $4::timestamptz[])
                as d(collectivite_id, demarche_id, document_id, modified_at)
       on conflict (demarche_id, document_id, etape) do nothing
       returning id
     )
     insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
     select 'demarche_document', id from inclusions`,
    [
      inclusions.map((i) => i.collectiviteId),
      inclusions.map((i) => i.demarcheId),
      inclusions.map((i) => i.documentId),
      inclusions.map((i) => i.date),
    ]
  );

  const autres = await client.query(
    `with documents as (
       insert into public.demarche_document_additional
         (collectivite_id, demarche_id, etape, fichier_id, modified_at)
       select collectivite_id, demarche_id, etape, fichier_id,
              coalesce(modified_at, now())
         from unnest($1::int[], $2::int[], $3::text[], $4::int[], $5::timestamptz[])
                as d(collectivite_id, demarche_id, etape, fichier_id, modified_at)
       returning id
     )
     insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
     select 'demarche_document_additional', id from documents`,
    [
      additionnels.map((r) => r.piece.fichier.collectiviteId),
      additionnels.map((r) => r.piece.fichier.demarcheId),
      additionnels.map((r) => r.etape),
      additionnels.map((r) => bibliotheque.getId(toDepot(r.piece))),
      additionnels.map((r) => r.piece.date),
    ]
  );

  if (
    cases.rowCount !== enCase.length ||
    autres.rowCount !== additionnels.length
  ) {
    throw new Error(
      `${rangements.length} pièces calculées, ${
        (cases.rowCount ?? 0) + (autres.rowCount ?? 0)
      } écrites : rien n'est validé.`
    );
  }
  return cochees.rowCount ?? 0;
};

/** Écrit les avis validés, sans déposant, et leur trace par saisine (l'avis n'a pas de numéro). */
export const createAvis = async (
  client: PoolClient,
  avis: readonly AvisEcrit[]
) => {
  const { rowCount } = await client.query(
    `with avis as (
       insert into public.demarche_pcaet_avis
         (demande_avis_id, emetteur_collectivite_id, au_titre_de, fichier_ref,
          valide_le, depose_le)
       select demande_avis_id, emetteur_collectivite_id, au_titre_de, fichier_ref,
              recu_le, recu_le
         from unnest($1::int[], $2::int[], $3::text[], $4::text[], $5::timestamptz[])
                as a(demande_avis_id, emetteur_collectivite_id, au_titre_de,
                     fichier_ref, recu_le)
       returning demande_avis_id
     )
     insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
     select 'demarche_pcaet_avis', demande_avis_id from avis`,
    [
      avis.map((a) => a.saisine.demandeAvisId),
      avis.map((a) => a.saisine.emetteurId),
      avis.map((a) => a.titre.auTitreDe),
      avis.map((a) => a.retenu.contenu.empreinte),
      avis.map((a) => a.date),
    ]
  );
  if (rowCount !== avis.length) {
    throw new Error(
      `${avis.length} avis calculés, ${
        rowCount ?? 0
      } écrits : rien n'est validé.`
    );
  }
};

/** Garde, appelée par `gardes.ts` : l'import est déjà passé. */
export const listCasBloquantsEcriture = async (client: PoolClient) => {
  const { rows } = await client.query<{ table: string; lignes: number }>(
    `select table_cible as "table", count(*)::int as lignes
       from reprise_tec.lignes_ecrites
      where table_cible = any($1)
      group by 1 order by 1`,
    [
      [
        TRACE_BIBLIOTHEQUE,
        'demarche_document',
        'demarche_document_additional',
        'demarche_pcaet_avis',
      ],
    ]
  );
  return rows.length === 0
    ? []
    : [
        `  l'import des pièces des dossiers est déjà passé (l'annuler d'abord) : ${rows
          .map((r) => `${r.lignes} ${r.table}`)
          .join(', ')}`,
      ];
};
