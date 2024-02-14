-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

alter table labellisation.demande
    alter column sujet
        drop default;

alter table labellisation.demande
    alter column sujet
        drop not null;

-- Local
alter table labellisation.demande
    drop constraint if exists demande_collectivite_id_referentiel_etoiles_key;
-- Prod
alter table labellisation.demande
    drop constraint if exists labellisation_collectivite_id_referentiel_etoiles_key;

update labellisation.demande
set sujet = null
where en_cours;

create or replace function labellisation_demande(collectivite_id integer, referentiel referentiel) returns labellisation.demande
    security definer
    language plpgsql
as
$$
declare
    current_audit audit;
    found         labellisation.demande;
begin

    if est_verifie() or is_service_role() then
        select *
        into current_audit
        from labellisation.current_audit(labellisation_demande.collectivite_id, labellisation_demande.referentiel);

        if(current_audit is null ) then
            return null;
        end if;
        if current_audit.demande_id is null
        then
            with demande as (
                insert into labellisation.demande (collectivite_id, referentiel, etoiles, sujet)
                    values (labellisation_demande.collectivite_id, labellisation_demande.referentiel, null, null)
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
    else
        perform set_config('response.status', '401', true);
        raise 'Accès non autorisé.';
    end if;
end;
$$;




COMMIT;
