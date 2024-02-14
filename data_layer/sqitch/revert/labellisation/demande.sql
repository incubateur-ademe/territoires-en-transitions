-- Deploy tet:labellisation/demande to pg
-- requires: labellisation/parcours
-- requires: labellisation/prerequis

BEGIN;

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
    else
        perform set_config('response.status', '401', true);
        raise 'Accès non autorisé.';
    end if;
end;
$$;


update labellisation.demande
set sujet = 'cot'::labellisation.sujet_demande
where en_cours;

alter table labellisation.demande
    add constraint demande_collectivite_id_referentiel_etoiles_key
    unique(collectivite_id, referentiel, etoiles);

alter table labellisation.demande
    alter column sujet
        set default 'cot'::labellisation.sujet_demande;

alter table labellisation.demande
alter column sujet
set not null;

COMMIT;
