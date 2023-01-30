-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

comment on table labellisation.demande is
    'Les demandes d''audit.';

comment on column labellisation.demande.en_cours is
    'Une demande en cours est une demande en attente de validation. '
        'Elle est créée lors du dépôt de preuve de labellisation.';

create type labellisation.sujet_demande as enum ('labellisation', 'labellisation_cot', 'cot');

alter table labellisation.demande
    add column sujet labellisation.sujet_demande
        default 'cot' not null;

alter table labellisation.demande
    alter column etoiles drop not null;
comment on column labellisation.demande.etoiles is
    'Le nombre d''étoiles si la demande d''audit concerne une labellisation.';

alter table labellisation.demande
    enable row level security;

alter table audit
    alter column date_debut drop not null;

alter table audit
    alter column date_debut set default null;

create policy allow_read
    on labellisation.demande
    for select
    using (is_authenticated());

create policy allow_insert
    on labellisation.demande
    for insert
    with check (have_edition_acces(collectivite_id));

create policy allow_update
    on labellisation.demande
    for update
    using (have_edition_acces(collectivite_id));

create function
    labellisation.validation_demande()
    returns trigger
as
$$
begin
    -- dans le cas ou une demande n'est plus en cours.
    if old.en_cours and not new.en_cours
    then
        -- on crée un audit.
        insert into audit (collectivite_id, referentiel, demande_id)
        select new.collectivite_id, new.referentiel, new.id;
    end if;
    return new;
end;
$$ language plpgsql;
comment on function labellisation.validation_demande is
    'Créé un audit si la demande est validée.';

create trigger after_write_demande
    after insert or update
    on labellisation.demande
    for each row
execute procedure labellisation.validation_demande();

drop function labellisation_demande;
create function
    labellisation_demande(
    collectivite_id integer,
    referentiel referentiel,
    etoiles labellisation.etoile
)
    returns labellisation.demande
begin
    atomic
    with data as (select labellisation_demande.collectivite_id,
                         labellisation_demande.referentiel,
                         labellisation_demande.etoiles
                  where have_edition_acces(labellisation_demande.collectivite_id))
    insert
    into labellisation.demande (collectivite_id, referentiel, etoiles)
    select *
    from data
    on conflict do nothing;

    select *
    from labellisation.demande ld
    where ld.collectivite_id = labellisation_demande.collectivite_id
      and ld.referentiel = labellisation_demande.referentiel
      and ld.etoiles = labellisation_demande.etoiles;
end;
comment on function labellisation_demande is
    'Renvoie la demande de labellisation pour une collectivité, un référentiel et un nombre d''étoiles donnés.'
        'Crée une demande en cours si aucune demande correspondante n''existe.';

drop function labellisation_submit_demande;
create or replace function
    labellisation_submit_demande(
    collectivite_id integer,
    referentiel referentiel,
    sujet labellisation.sujet_demande,
    etoiles labellisation.etoile default null
)
    returns labellisation.demande
as
$$
begin
    if (labellisation_submit_demande.sujet = 'cot' and labellisation_submit_demande.etoiles is not null)
        or (labellisation_submit_demande.sujet != 'cot' and labellisation_submit_demande.etoiles is null)
    then
        raise exception 'Seulement si le sujet de la demande est "cot", étoiles devrait être null.';
    end if;

    with data as (select labellisation_submit_demande.collectivite_id,
                         labellisation_submit_demande.referentiel,
                         labellisation_submit_demande.etoiles,
                         labellisation_submit_demande.sujet
                  where is_any_role_on(labellisation_submit_demande.collectivite_id))

    insert
    into labellisation.demande (collectivite_id, referentiel, etoiles, sujet, en_cours)
    select *, false
    from data
    on conflict (collectivite_id, referentiel, etoiles) do update set en_cours = excluded.en_cours,
                                                                      sujet    = excluded.sujet;

    select *
    from labellisation.demande ld
    where ld.collectivite_id = labellisation_submit_demande.collectivite_id
      and ld.referentiel = labellisation_submit_demande.referentiel
      and ld.etoiles = labellisation_submit_demande.etoiles;
end;
$$
    language plpgsql;
comment on function labellisation_submit_demande is
    'Soumet une demande de labellisation pour une collectivité, un référentiel et un nombre d''étoiles donnés.'
        'Met à jour ou créé une demande qui n''est pas en cours.';

COMMIT;
