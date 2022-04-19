create schema if not exists labellisation;

create or replace function
    labellisation.critere_1_1(collectivite_id integer, referentiel referentiel)
    returns boolean
as
$$
with ref as (select id as action_id
             from action_relation r
             where r.referentiel = critere_1_1.referentiel),
     statuts as (select s.action_id
                 from action_statut s
                          join ref on ref.action_id = s.action_id
                 where s.collectivite_id = critere_1_1.collectivite_id)
select count(*) = 0
from ((select * from ref) except (select * from statuts)) as r
$$ language sql;
comment on function labellisation.critere_1_1 is
    'Critère 1.1 : Renseigner tous les statuts';
