import { PoolClient } from 'pg';

export const createDossiers = async (client: PoolClient) => {
  await client.query(`
    drop table if exists reprise_tec.recette_dossier;
    create table reprise_tec.recette_dossier (
      tec_dossier_id         bigint primary key,
      tec_collectivite_id    bigint,
      definitif_de           bigint,
      nom                    text,
      etat                   text,
      types                  integer[],
      publie                 boolean,
      oblige                 boolean,
      version                text,
      cree_le                date,
      lance_le               date,
      lance_brut             text,
      reception_projet_le    date,
      avis_dreal_le          date,
      avis_cr_le             date,
      depot_definitif_le     date,
      mis_a_jour_le          date,
      elu_referent           text,
      description            text,
      population_couverte    bigint,
      commentaire_statut     text,
      premier_plan_climat    boolean,
      verifie_ademe          boolean,
      motif                  text,
      melange                boolean not null,
      tet_demarche_id        integer,
      adoption_decidee_par   text
    );
    create index on reprise_tec.recette_dossier (tec_collectivite_id);
    create index on reprise_tec.recette_dossier (tet_demarche_id);
  `);
  const { rowCount } = await client.query(`
    insert into reprise_tec.recette_dossier
    select d.id,
           dc.collectivite_id,
           m.id,
           d.nom,
           d.demarche_etat_code,
           (select array_agg(t.type_demarche_id order by t.type_demarche_id)
              from reprise_tec.staging_demarche_type_demarche t
             where t.demarche_id = d.id),
           d.publie,
           d.oblige,
           d.version,
           d.date_creation::date,
           d.date_lancement::date,
           d.date_lancement::text,
           d.date_reception_projet::date,
           d.date_envoi_avis_dreal::date,
           d.date_envoi_avis_cr::date,
           d.date_depot_definitif::date,
           d.date_mise_a_jour::date,
           d.elu_referent,
           d.description_rapide,
           d.population_couverte,
           d.commentaire_statut,
           d.premier_plan_climat,
           d.verifie_ademe,
           (select e.motif from reprise_tec.ecarts e
             where e.table_source = 'demarche' and e.tec_id = d.id
               and e.precision = '' and e.motif <> 'total_melange'),
           exists (select 1 from reprise_tec.ecarts e
                    where e.table_source = 'demarche' and e.tec_id = d.id
                      and e.motif = 'total_melange'),
           c.tet_id,
           c.adoption_decidee_par
      from reprise_tec.staging_demarche d
      left join reprise_tec.staging_demarche_collectivite dc
        on dc.demarche_id = d.id and dc.principale
      left join reprise_tec.staging_demarche m on m.pcaet_definitif = d.id
      left join reprise_tec.correspondance c
        on c.table_cible = 'demarche' and c.tec_id = d.id`);
  return { ecrites: rowCount ?? 0 };
};
