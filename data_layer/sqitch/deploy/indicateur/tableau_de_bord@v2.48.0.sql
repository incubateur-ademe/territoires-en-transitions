-- Deploy tet:indicateur/tableau_de_bord to pg

BEGIN;

create view indicateur_summary
as
with r as (select indicateur_id, collectivite_id, count(*)
           from indicateur_resultat r
           group by indicateur_id, collectivite_id)
select collectivite_id,
       indicateur_id,
       indicateur_group,
       r.count as resultats
from indicateur_definition id
         join r on id.id = r.indicateur_id
where have_lecture_acces(collectivite_id);
comment on view indicateur_summary is 'Permet d''obtenir le nombre de résultats saisis par indicateur pour chaque collectivité.';

COMMIT;
