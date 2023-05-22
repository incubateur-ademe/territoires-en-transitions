-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

create or replace function
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

alter table labellisation.demande
    drop demandeur;

COMMIT;
