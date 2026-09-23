import { PoolClient } from 'pg';
import { Dossier } from './dossier';

/**
 * Écrit chaque dossier et le note dans `reprise_tec` : `correspondance` (son
 * identifiant T&C) et `lignes_ecrites` (ce qui a été écrit, pour pouvoir annuler).
 */
export const createDossiers = async (
  client: PoolClient,
  dossiers: readonly Dossier[]
) => {
  for (const { tecId, colonnes: c } of dossiers) {
    await client.query(
      `with nouvelle as (
         insert into public.demarche (
           collectivite_id, type, titre, description, status, obligation,
           launched_at, published_at, transmitted_at, avis_deadline_at,
           adopted_at, created_at
         )
         values ($1, 'pcaet', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         returning id
       ), correspondance as (
         insert into reprise_tec.correspondance (table_cible, tec_id, tet_id)
         select 'demarche', $12, id from nouvelle
       )
       insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
       select 'demarche', id from nouvelle`,
      [
        c.collectiviteId,
        c.titre,
        c.description,
        c.status,
        c.obligation,
        c.launchedAt,
        c.publishedAt,
        c.transmittedAt,
        c.avisDeadlineAt,
        c.adoptedAt,
        c.createdAt,
        tecId,
      ]
    );
  }
};
