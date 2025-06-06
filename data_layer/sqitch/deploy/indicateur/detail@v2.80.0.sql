-- Deploy tet:indicateur/detail to pg

BEGIN;

create view indicateur_definitions
as
select c.id           as collectivite_id,
       definition.id  as indicateur_id,
       null::integer  as indicateur_perso_id,
       definition.nom as nom,
       definition.description,
       definition.unite
from collectivite c
         cross join indicateur_definition definition
union all
select definition.collectivite_id as collectivite_id,
       null::indicateur_id        as indicateur_id,
       definition.id              as indicateur_perso_id,
       definition.titre,
       definition.description,
       definition.unite
from indicateur_personnalise_definition definition
where have_edition_acces(collectivite_id);
comment on view indicateur_definitions
    is 'Les définitions des indicateurs prédéfinis et personnalisés';

create function
    services(indicateur_definitions)
    returns setof service_tag[]
    rows 1
begin
    atomic
    select coalesce(
                   (select case
                               when $1.indicateur_id is not null -- indicateur prédéfini
                                   then
                                   (select array_agg(st)
                                    from indicateur_service_tag ist
                                             join service_tag st on ist.service_tag_id = st.id
                                    where ist.collectivite_id = $1.collectivite_id
                                      and ist.indicateur_id = $1.indicateur_id)
                               else -- indicateur personnalisé
                                   (select array_agg(st)
                                    from indicateur_personnalise_service_tag ist
                                             join service_tag st on ist.service_tag_id = st.id
                                    where ist.indicateur_id = $1.indicateur_perso_id)
                               end),
                   '{}'::service_tag[]
           );
end;
comment on function services is
    'La liste de services pilotes rattachés à un indicateur.';

create function
    private.get_personne(indicateur_pilote)
    returns personne
    security definer
begin
    atomic
    select case
               when $1.tag_id is not null
                   then (select row (pt.nom, pt.collectivite_id, $1.tag_id, null::uuid)::personne
                         from personne_tag pt
                         where pt.id = $1.tag_id)
               else (select row (u.prenom || ' ' || u.nom, $1.collectivite_id, null::integer, u.user_id)::personne
                     from utilisateur.dcp_display u
                     where u.user_id = $1.user_id)
               end;
end;
comment on function private.get_personne(indicateur_pilote) is
    'Renvoie la personne pilote d''un indicateur.';


create function
    private.get_personne(indicateur_personnalise_pilote)
    returns personne
    security definer
begin
    atomic
    select case
               when $1.tag_id is not null
                   then (select (select row (pt.nom, pt.collectivite_id, $1.tag_id, null::uuid)::personne
                                 from personne_tag pt
                                 where pt.id = $1.tag_id))
               else (select row (u.prenom || ' ' || u.nom,
                                (select collectivite_id
                                 from indicateur_personnalise_definition d
                                 where d.id = $1.indicateur_id),
                                null::integer,
                                u.user_id)::personne
                     from utilisateur.dcp_display u
                     where u.user_id = $1.user_id)
               end;
end;
comment on function private.get_personne(indicateur_personnalise_pilote) is
    'Renvoie la personne pilote d''un indicateur personnalisé.';

create function
    pilotes(indicateur_definitions)
    returns setof personne[]
    rows 1
begin
    atomic
    select coalesce(
                   (select case
                               when $1.indicateur_id is not null -- indicateur prédéfini
                                   then
                                   (select array_agg(private.get_personne(pilote))
                                    from indicateur_pilote pilote
                                    where pilote.collectivite_id = $1.collectivite_id
                                      and pilote.indicateur_id = $1.indicateur_id)
                               else -- indicateur personnalisé
                                   (select array_agg(private.get_personne(pilote))
                                    from indicateur_personnalise_pilote pilote
                                    where pilote.indicateur_id = $1.indicateur_perso_id)
                               end),
                   '{}'::personne[]
           );
end;
comment on function pilotes is
    'La liste des personnes pilotes pour un indicateur.';

create or replace function
    thematiques(indicateur_definitions)
    returns setof thematique[]
    rows 1
begin
    atomic
    select coalesce(
                   (select case
                               when $1.indicateur_id is not null -- indicateur prédéfini
                                   then
                                   (select array_agg(thematique)
                                    from indicateur_definition definition
                                             join thematique
                                                  on thematique.md_id = any (definition.thematiques)
                                    where definition.id = $1.indicateur_id)
                               else -- indicateur personnalisé
                                   (select array_agg(thematique)
                                    from indicateur_personnalise_definition definition
                                             join indicateur_personnalise_thematique it
                                                  on definition.id = it.indicateur_id
                                             join thematique on it.thematique_id = thematique.id
                                    where definition.id = $1.indicateur_perso_id)
                               end),
                   '{}'::thematique[]
           );
end;
comment on function thematiques is
    'La listes des thématiques d''un indicateur.';

COMMIT;
