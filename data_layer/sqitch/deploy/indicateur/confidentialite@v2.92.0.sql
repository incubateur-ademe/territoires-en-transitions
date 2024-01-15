-- Deploy tet:indicateur/confidentialite to pg

BEGIN;

--- liste les indicateurs marqués "confidentiel"
create table indicateur_confidentiel
(
    indicateur_id       text references indicateur_definition,
    indicateur_perso_id integer references indicateur_personnalise_definition,
    collectivite_id     integer references collectivite,
    unique (indicateur_id, collectivite_id, indicateur_perso_id)
);

--- vérifie que les colonnes sont cohérentes
alter table indicateur_confidentiel
    add constraint perso_ou_predefini
        check ( -- prédéfini
            (indicateur_id is not null and collectivite_id is not null and indicateur_perso_id is null)
                -- personnalisé
                or (indicateur_perso_id is not null and indicateur_id is null and collectivite_id is null)
            );
comment on constraint perso_ou_predefini on indicateur_confidentiel is
    'Vérifie que l''on référence un indicateur perso ou un indicateur prédéfini.';

--- trigger pour la réécriture des id d'indicateurs liés
create trigger rewrite_indicateur_id
    before insert or update
    on indicateur_confidentiel
    for each row
execute procedure rewrite_indicateur_id();
comment on trigger rewrite_indicateur_id on indicateur_confidentiel is
    'Remplace les `indicateur_id` des indicateurs `sans valeur` de la même manière que pour les valeurs';

--- détermine si un indicateur est confidentiel
create function
    confidentiel(indicateur_definitions)
    returns bool
    language sql
    security definer
    stable
begin
    atomic
    select count(*) > 0
    from indicateur_confidentiel ic
             left join definition_referentiel($1) def on true
    where
       -- indicateur prédéfini
        ($1.indicateur_id is not null
            and ic.indicateur_id = $1.indicateur_id
            and collectivite_id = $1.collectivite_id)
       -- indicateur prédéfini dont les valeurs sont celles d'un autre
       or ($1.indicateur_id is not null
        and ic.indicateur_id = def.valeur_indicateur
        and collectivite_id = $1.collectivite_id)
       -- indicateur perso
       or ($1.indicateur_perso_id is not null
        and ic.indicateur_perso_id = $1.indicateur_perso_id);
end;
comment on function confidentiel(indicateur_definitions) is
    'Vrai si l''indicateur est confidentiel.';

--- RLS
create function
    private.can_write(indicateur_confidentiel)
    returns bool
    language sql
    volatile
begin
    atomic
    select case
               when $1.indicateur_id is not null -- indicateur prédéfini
                   then
                   have_edition_acces($1.collectivite_id)
                       or private.est_auditeur($1.collectivite_id)
               else -- indicateur personnalisé
                   have_edition_acces((select collectivite_id
                                       from indicateur_personnalise_definition d
                                       where d.id = $1.indicateur_perso_id))
                       or private.est_auditeur((select collectivite_id
                                                from indicateur_personnalise_definition d
                                                where d.id = $1.indicateur_perso_id))
               end;
end;
comment on function private.can_write(indicateur_confidentiel) is
    'Vrai si l''utilisateur peut écrire un `indicateur_confidentiel`.';

create function
    private.can_read(indicateur_confidentiel)
    returns bool
    language sql
    volatile
begin
    atomic
    select case
               when $1.indicateur_id is not null -- indicateur prédéfini
                   then
                   can_read_acces_restreint($1.collectivite_id)
               else -- indicateur personnalisé
                   can_read_acces_restreint((select collectivite_id
                                             from indicateur_personnalise_definition d
                                             where d.id = $1.indicateur_perso_id))
               end;
end;
comment on function private.can_read(indicateur_confidentiel) is
    'Vrai si l''utilisateur peut lire un `indicateur_confidentiel`.';

create policy allow_insert on indicateur_confidentiel
    for insert with check (private.can_write(indicateur_confidentiel));
create policy allow_read on indicateur_confidentiel
    for select using (private.can_read(indicateur_confidentiel));
create policy allow_update on indicateur_confidentiel
    for update using (private.can_write(indicateur_confidentiel));
create policy allow_delete on indicateur_confidentiel
    for delete using (private.can_write(indicateur_confidentiel));
alter table indicateur_confidentiel
    enable row level security;


create function
    private.is_valeur_confidentielle(collectivite_id integer, indicateur_id indicateur_id, annee integer)
    returns bool
    language sql
    stable
    security definer
begin
    atomic
    -- la valeur est confidentielle si
    return
        -- l'indicateur est confidentiel
        exists (select *
                from indicateur_confidentiel c
                where c.indicateur_id = is_valeur_confidentielle.indicateur_id
                  and c.collectivite_id = is_valeur_confidentielle.collectivite_id)
            -- et l'année est la dernière
            and annee = (select max(r.annee)
                         from indicateur_resultat r
                         where r.indicateur_id = is_valeur_confidentielle.indicateur_id
                           and r.collectivite_id = is_valeur_confidentielle.collectivite_id
                           and r.valeur is not null);
end;
comment on function private.is_valeur_confidentielle(integer, indicateur_id, integer) is
    'Vrai si la valeur annuelle de l''indicateur est confidentielle.';

create function
    private.is_valeur_confidentielle(indicateur_perso_id integer, annee integer)
    returns bool
    language sql
    stable
    security definer
begin
    atomic
    -- la valeur est confidentielle si
    return
        -- l'indicateur est confidentiel
        exists (select *
                from indicateur_confidentiel c
                where c.indicateur_perso_id = is_valeur_confidentielle.indicateur_perso_id)
            -- et l'année est la dernière
            and annee = (select max(r.annee)
                         from indicateur_personnalise_resultat r
                         where r.indicateur_id = is_valeur_confidentielle.indicateur_perso_id
                           and r.valeur is not null);
end;
comment on function private.is_valeur_confidentielle(integer, integer) is
    'Vrai si la valeur annuelle de l''indicateur est confidentielle.';


-- on recrée la vue indicateur afin de censurer la valeur la plus récente.
drop view indicateurs;
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
         left join indicateur_confidentiel confidentiel
                   on r.indicateur_id = confidentiel.indicateur_id
                       and r.collectivite_id = confidentiel.collectivite_id
         left join indicateur_resultat_commentaire c
                   on r.indicateur_id = c.indicateur_id
                       and r.collectivite_id = c.collectivite_id
                       and r.annee = c.annee

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
         left join indicateur_perso_objectif_commentaire c using (collectivite_id, indicateur_id, annee);

drop policy allow_read on indicateur_resultat;
create policy allow_read on indicateur_resultat
    as permissive
    for select
    using ((select can_read_acces_restreint(collectivite_id)
                       and (have_lecture_acces(collectivite_id)
        or not private.is_valeur_confidentielle(collectivite_id, indicateur_id, annee)))
    );

drop policy allow_read on indicateur_personnalise_resultat;
create policy allow_read on indicateur_personnalise_resultat
    as permissive
    for select
    using ((select can_read_acces_restreint(collectivite_id)
                       and
                   (have_lecture_acces(collectivite_id)
                       or not private.is_valeur_confidentielle(indicateur_id, annee))));

COMMIT;
