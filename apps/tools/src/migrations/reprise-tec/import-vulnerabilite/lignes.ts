/** Les lignes de vulnérabilité des dossiers repris, lues sur la ligne reprise du dossier seule (son doublon « définitif » n'est pas lu). */

import { PoolClient } from 'pg';
import {
  readObjectif,
  readVulnerable,
  type Objectif,
  type Vulnerable,
} from './niveau';
import { findThematique, type Thematique } from './thematiques';

export type Ligne = {
  // la ligne T&C
  id: number;
  dossierTecId: number;
  demarcheId: number;
  collectiviteId: number;
  collectivite: string;
  libelle: string;
  thematique: Thematique | null;
  vulnerable: Vulnerable;
  objectif: Objectif;
};

/** Lit chaque ligne avec sa démarche, sa collectivité, sa thématique, son niveau et son objectif, triées. */
export const loadLignes = async (client: PoolClient): Promise<Ligne[]> => {
  const { rows } = await client.query<{
    id: number;
    dossierTecId: number;
    demarcheId: number;
    collectiviteId: number;
    collectivite: string;
    libelle: string | null;
    vulnerable: string | null;
    objectifFixe: string | null;
  }>(
    `select v.id::int, c.tec_id::int as "dossierTecId", d.id as "demarcheId",
            d.collectivite_id as "collectiviteId", co.nom as collectivite,
            v.libelle, v.vulnerable, v.objectif_fixe as "objectifFixe"
       from reprise_tec.staging_demarche_domaine_vulnerabilite v
       join reprise_tec.correspondance c
         on c.table_cible = 'demarche' and c.tec_id = v.demarche_id
       join public.demarche d on d.id = c.tet_id
       join public.collectivite co on co.id = d.collectivite_id
      order by d.id, v.id`
  );
  return rows.map(({ libelle, vulnerable, objectifFixe, ...ligne }) => ({
    ...ligne,
    libelle: libelle ?? '',
    thematique: findThematique(libelle),
    vulnerable: readVulnerable(vulnerable),
    objectif: readObjectif(objectifFixe),
  }));
};
