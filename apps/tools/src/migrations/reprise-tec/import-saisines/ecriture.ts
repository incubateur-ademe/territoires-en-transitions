/** L'écriture des saisines, et leur trace dans `lignes_ecrites` pour l'annulation. */

import type { DemandeAvisSource } from '@tet/backend/demarches/pcaet/shared/models/pcaet-demande-avis.table';
import { PoolClient } from 'pg';
import type { Saisine } from './services';

const SOURCE: DemandeAvisSource = 'transmission';

/**
 * Écrit les saisines, datées du jour de la transmission pour avis, et leur trace ; rend leur nombre.
 * `perimetre` est toujours écrit : laissée au défaut `principal`, une saisine secondaire attendrait un avis.
 */
export const createSaisines = async (
  client: PoolClient,
  saisines: readonly Saisine[]
) => {
  const { rowCount } = await client.query(
    `with nouvelles as (
       insert into public.demarche_pcaet_demande_avis
         (demarche_id, instructeur_collectivite_id, source, perimetre, created_at)
       select s.demarche_id, s.service_id, $4, s.perimetre, d.transmitted_at
         from unnest($1::int[], $2::int[], $3::text[])
                with ordinality as s(demarche_id, service_id, perimetre, rang)
         join public.demarche d on d.id = s.demarche_id
        order by s.rang
       returning id
     )
     insert into reprise_tec.lignes_ecrites (table_cible, ligne_id)
     select 'demarche_pcaet_demande_avis', id from nouvelles`,
    [
      saisines.map((s) => s.dossier.demarcheId),
      saisines.map((s) => s.serviceId),
      saisines.map((s) => s.perimetre),
      SOURCE,
    ]
  );
  return rowCount ?? 0;
};
