-- Verify tet:collectivite/toutes_les_collectivites on pg

BEGIN;

comment on type filterable_type_collectivite is '';
comment on type collectivite_filtre_type is '';

select type, id, libelle, intervalle
from filtre_intervalle
where false;

select collectivite_id,
       nom,
       type_collectivite,
       code_siren_insee,
       region_code,
       departement_code,
       population,
       etoiles_cae,
       etoiles_eci,
       etoiles_all,
       score_fait_cae,
       score_fait_eci,
       score_fait_max,
       score_fait_sum,
       score_programme_cae,
       score_programme_eci,
       score_programme_max,
       score_programme_sum,
       completude_cae,
       completude_eci,
       completude_max,
       population_intervalle,
       completude_cae_intervalle,
       completude_eci_intervalle,
       completude_intervalles,
       fait_cae_intervalle,
       fait_eci_intervalle,
       fait_intervalles
from collectivite_card
where false;

ROLLBACK;
