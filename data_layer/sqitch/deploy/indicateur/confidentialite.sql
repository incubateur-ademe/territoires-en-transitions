-- Deploy tet:indicateur/confidentialite to pg

BEGIN;

--- liste les indicateurs marqués "confidentiel"
create table indicateur_confidentiel 
(
    indicateur_id text references indicateur_definition,
    indicateur_perso_id integer references indicateur_personnalise_definition,
    collectivite_id integer references collectivite,
    unique(indicateur_id, collectivite_id, indicateur_perso_id)
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

COMMIT;
