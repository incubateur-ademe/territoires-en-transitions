-- Deploy tet:export/ademe to pg

BEGIN;

create view export.ademe
as
with progresses as (select c.id              as collectivite_id,
                           min(p.completude) as min_completude
                    from collectivite c
                             join private.referentiel_progress(c.id) p on true
                    group by c.id)
select p.collectivite_id,
       export.identite(p.collectivite_id),
       export.contacts(p.collectivite_id),
       export.questions(p.collectivite_id),
       export.scores(p.collectivite_id, 'eci') as eci,
       export.scores(p.collectivite_id, 'cae') as cae

from progresses p;

COMMIT;
