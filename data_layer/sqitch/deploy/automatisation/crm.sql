-- Deploy tet:utils/automatisation to pg

BEGIN;

drop view crm_collectivites;

create view crm_collectivites
as
select c.nom || ' (' || c.collectivite_id || ')' as key,
       c.collectivite_id,
       c.nom,
       c.type_collectivite,
       c.nature_collectivite,
       c.code_siren_insee,
       c.region_name,
       c.region_code,
       c.departement_name,
       c.departement_code,
       c.population_totale,
       coalesce(cot.actif, false) as cot,
       ll_cae.etoiles as lab_cae_etoiles,
       ll_cae.score_programme as lab_cae_programme,
       ll_cae.score_realise as lab_cae_realise,
       ll_cae.annee as lab_cae_annee,
       ll_eci.etoiles as lab_eci_etoiles,
       ll_eci.score_programme as lab_eci_programme,
       ll_eci.score_realise as lab_eci_realise,
       ll_eci.annee as lab_eci_annee
from stats.collectivite c
         left join cot using (collectivite_id)
         left join lateral (select l2.referentiel,
                                   l2.etoiles,
                                   l2.score_programme,
                                   l2.score_realise,
                                   l2.annee
                            from labellisation l2
                            where l2.collectivite_id = c.collectivite_id
                              and l2.referentiel = 'cae'
                            order by annee desc
                            limit 1) as ll_cae on true
         left join lateral (select l2.referentiel,
                                   l2.etoiles,
                                   l2.score_programme,
                                   l2.score_realise,
                                   l2.annee
                            from labellisation l2
                            where l2.collectivite_id = c.collectivite_id
                              and l2.referentiel = 'eci'
                            order by annee desc
                            limit 1) as ll_eci on true
where is_service_role();

COMMIT;
