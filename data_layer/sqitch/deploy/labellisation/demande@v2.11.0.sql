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

alter table audit
    alter column date_debut drop not null;

alter table audit
    alter column date_debut set default null;

drop function labellisation_demande;
create or replace function
    labellisation_demande(
    collectivite_id integer,
    referentiel referentiel
)
    returns labellisation.demande
    security definer
as
$$
declare
    current_audit audit;
    found         labellisation.demande;
begin
    select *
    into current_audit
    from labellisation.current_audit(labellisation_demande.collectivite_id, labellisation_demande.referentiel);

    if current_audit.demande_id is null
    then
        with demande as (
            insert into labellisation.demande (collectivite_id, referentiel, etoiles, sujet)
                values (labellisation_demande.collectivite_id, labellisation_demande.referentiel, null, 'cot')
                returning id),
             audit as (
                 update audit
                     set demande_id = demande.id
                     from demande
                     where audit.id = current_audit.id
                     returning *)
        select audit.*
        from audit
        into current_audit;
    end if;

    select *
    into found
    from labellisation.demande
    where id = current_audit.demande_id;

    return found;
end;
$$ language plpgsql;
comment on function labellisation_demande is
    'Renvoie la demande de labellisation pour une collectivité, un référentiel et un nombre d''étoiles donnés.'
        'Crée une demande en cours si aucune demande correspondante n''existe.';

drop function labellisation_submit_demande;
create function
    labellisation_submit_demande(
    collectivite_id integer,
    referentiel referentiel,
    sujet labellisation.sujet_demande,
    etoiles labellisation.etoile default null
)
    returns labellisation.demande
    security definer
as
$$
declare
    demande labellisation.demande;
begin
    if (labellisation_submit_demande.sujet = 'cot' and labellisation_submit_demande.etoiles is not null)
        or (labellisation_submit_demande.sujet != 'cot' and labellisation_submit_demande.etoiles is null)
    then
        raise exception 'Seulement si le sujet de la demande est "cot", étoiles devrait être null.';
    end if;

    select *
    from labellisation_demande(
            labellisation_submit_demande.collectivite_id,
            labellisation_submit_demande.referentiel
        )
    into demande;

    update labellisation.demande ld
    set etoiles  = labellisation_submit_demande.etoiles,
        sujet    = labellisation_submit_demande.sujet,
        en_cours = false
    where ld.id = demande.id
    returning * into demande;

    return demande;
end ;
$$
    language plpgsql;
comment on function labellisation_submit_demande is
    'Soumet une demande de labellisation pour une collectivité, un référentiel et un nombre d''étoiles donnés.'
        'Met à jour ou créé une demande qui n''est pas en cours.';

COMMIT;
