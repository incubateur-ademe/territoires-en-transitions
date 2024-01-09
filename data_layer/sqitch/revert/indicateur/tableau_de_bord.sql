-- Deploy tet:indicateur/tableau_de_bord to pg

BEGIN;

create or replace view indicateur_summary
as
select c.id            as collectivite_id,
       programme::text as categorie,
       digest.nombre,
       digest.rempli
from collectivite c
         cross join unnest(enum_range(null::indicateur_programme)) programme
         join lateral (select count(*)                                             as nombre,
                              count(*) filter (where private.rempli(c.id, def.id)) as rempli
                       from indicateur_definition def
                       where parent is null and programme = any (def.programmes)) digest on true
union all
select perso.collectivite_id,
       'perso',
       count(*),
       count(*) filter (where private.rempli(perso.id))
from indicateur_personnalise_definition perso
where have_edition_acces(collectivite_id)
group by collectivite_id;
comment on view indicateur_summary is 'Permet d''obtenir le nombre de résultats saisis par indicateur pour chaque collectivité.';

COMMIT;
