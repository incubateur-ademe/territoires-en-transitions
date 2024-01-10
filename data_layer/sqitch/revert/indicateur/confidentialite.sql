-- Revert tet:indicateur/confidentialite from pg

BEGIN;

drop view indicateurs;
drop function private.is_valeur_confidentielle(integer, indicateur_id, integer);
drop function private.is_valeur_confidentielle(integer, integer);

drop function confidentiel(indicateur_definitions);
drop policy allow_insert on indicateur_confidentiel;
drop policy allow_read on indicateur_confidentiel;
drop policy allow_update on indicateur_confidentiel;
drop policy allow_delete on indicateur_confidentiel;
drop function private.can_write(indicateur_confidentiel);
drop function private.can_read(indicateur_confidentiel);
drop table indicateur_confidentiel;

-- la version précédente de la vue indicateurs
create view indicateurs
as
select 'resultat'::indicateur_valeur_type as type,
       r.collectivite_id                  as collectivite_id,
       r.indicateur_id                    as indicateur_id,
       null::integer                      as indicateur_perso_id,
       r.annee                            as annee,
       r.valeur                           as valeur,
       c.commentaire                      as commentaire,
       null::text                         as source,
       null::text                         as source_id
from indicateur_resultat r
         join indicateur_definition d on r.indicateur_id = d.id
         left join indicateur_resultat_commentaire c
                   on r.indicateur_id = c.indicateur_id
                       and r.collectivite_id = c.collectivite_id
                       and r.annee = c.annee
where can_read_acces_restreint(r.collectivite_id)
union all

--- indicateurs dont le résultat est en fait celui d'un autre.
select 'resultat'::indicateur_valeur_type as type,
       r.collectivite_id,
       alt.id,
       null::integer,
       r.annee,
       r.valeur,
       c.commentaire,
       null::text,
       null::text
from indicateur_resultat r
         join indicateur_definition alt on r.indicateur_id = alt.valeur_indicateur
         left join indicateur_resultat_commentaire c
                   on r.indicateur_id = c.indicateur_id
                       and r.collectivite_id = c.collectivite_id
                       and r.annee = c.annee
where can_read_acces_restreint(r.collectivite_id)

union all
select 'objectif'::indicateur_valeur_type as type,
       o.collectivite_id,
       d.id,
       null,
       o.annee,
       o.valeur,
       c.commentaire,
       null::text,
       null::text
from indicateur_objectif o
         join indicateur_definition d on o.indicateur_id = d.id
         left join indicateur_objectif_commentaire c
                   on o.indicateur_id = c.indicateur_id
                       and o.collectivite_id = c.collectivite_id
                       and o.annee = c.annee
where can_read_acces_restreint(o.collectivite_id)
union all

--- indicateurs dont l'objectif est en fait celui d'un autre.
select 'objectif'::indicateur_valeur_type as type,
       o.collectivite_id,
       alt.id,
       null,
       o.annee,
       o.valeur,
       c.commentaire,
       null::text,
       null::text
from indicateur_objectif o
         join indicateur_definition alt on o.indicateur_id = alt.valeur_indicateur
         left join indicateur_objectif_commentaire c
                   on o.indicateur_id = c.indicateur_id
                       and o.collectivite_id = c.collectivite_id
                       and o.annee = c.annee
where can_read_acces_restreint(o.collectivite_id)

union all
select 'import'::indicateur_valeur_type as type,
       collectivite_id,
       indicateur_id,
       null,
       annee,
       valeur,
       null,
       source,
       source_id
from indicateur_resultat_import
where can_read_acces_restreint(collectivite_id)

union all
--- indicateurs dont le résultat est en fait celui d'un autre.
select 'import'::indicateur_valeur_type as type,
       i.collectivite_id,
       alt.id,
       null::integer,
       i.annee,
       i.valeur,
       null,
       i.source,
       i.source_id
from indicateur_resultat_import i
         join indicateur_definition alt on i.indicateur_id = alt.valeur_indicateur
where can_read_acces_restreint(i.collectivite_id)

union all
select 'resultat'::indicateur_valeur_type as type,
       collectivite_id,
       null,
       r.indicateur_id,
       r.annee,
       r.valeur,
       c.commentaire,
       null,
       null
from indicateur_personnalise_resultat r
         left join indicateur_perso_resultat_commentaire c using (collectivite_id, indicateur_id, annee)
where can_read_acces_restreint(collectivite_id)

union all
select 'objectif'::indicateur_valeur_type as type,
       r.collectivite_id,
       null,
       r.indicateur_id,
       r.annee,
       r.valeur,
       commentaire,
       null,
       null
from indicateur_personnalise_objectif r
         left join indicateur_perso_objectif_commentaire c using (collectivite_id, indicateur_id, annee)
where can_read_acces_restreint(collectivite_id);

COMMIT;
