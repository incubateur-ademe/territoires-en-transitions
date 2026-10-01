import { PoolClient } from 'pg';
import {
  readObjectif,
  readVulnerable,
  type Objectif,
  type Vulnerable,
} from './niveau';
import { findThematique, type Thematique } from './thematiques';

export type Ligne = {
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

/** Tourne avant `loadLignes`, dont la jointure sur `demarche` ferait disparaître ces lignes en silence. */
export const listCasBloquantsDossiers = async (client: PoolClient) => {
  const { rows } = await client.query<{
    cas: 'aucun_dossier' | 'demarche';
    tecId: number | null;
    tetId: number | null;
  }>(
    `select 'aucun_dossier' as cas, null::int as "tecId", null::int as "tetId"
      where not exists (select from reprise_tec.correspondance
                         where table_cible = 'demarche')
     union all
     select distinct 'demarche', c.tec_id::int, c.tet_id::int
       from reprise_tec.correspondance c
       join reprise_tec.staging_demarche_domaine_vulnerabilite v on v.demarche_id = c.tec_id
      where c.table_cible = 'demarche'
        and not exists (select from public.demarche d where d.id = c.tet_id)
      order by 1, 2`
  );
  return rows.map(({ cas, tecId, tetId }) =>
    cas === 'aucun_dossier'
      ? "  aucun dossier repris : l'import des dossiers (import-demarches) n'a pas tourné"
      : `  démarche ${tetId} introuvable : dossier T&C ${tecId}, sa vulnérabilité n'a plus de place`
  );
};
