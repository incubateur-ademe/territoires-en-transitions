-- Revert tet:indicateur/source from pg

BEGIN;

drop view indicateurs;
drop function import_sources(indicateur_definitions);
alter table indicateur_resultat_import drop column source_id;
drop table indicateur_source;

create view indicateurs
as
select 'resultat'::indicateur_valeur_type as type,
       r.collectivite_id                  as collectivite_id,
       r.indicateur_id                    as indicateur_id,
       null::integer                      as indicateur_perso_id,
       r.annee                            as annee,
       r.valeur                           as valeur,
       c.commentaire                      as commentaire,
       null::text                         as source
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
       source
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
       i.source
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
       null
from indicateur_personnalise_objectif r
         left join indicateur_perso_objectif_commentaire c using (collectivite_id, indicateur_id, annee)
where can_read_acces_restreint(collectivite_id)
;

COMMIT;
