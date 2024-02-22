-- Deploy tet:retool/audit to pg

BEGIN;

create function retool_patch_demande(
    demande_id integer,
    sujet labellisation.sujet_demande,
    etoiles labellisation.etoile DEFAULT NULL::labellisation.etoile
) returns void
    security definer
    language plpgsql
as
$$
begin
    if is_service_role() then
        if not ((retool_patch_demande.sujet = 'cot' and retool_patch_demande.etoiles is not null)
            or (retool_patch_demande.sujet != 'cot' and retool_patch_demande.etoiles is null))
        then
            update labellisation.demande ld
            set etoiles   = retool_patch_demande.etoiles,
                sujet     = retool_patch_demande.sujet
            where ld.id = retool_patch_demande.demande_id;
        else
            raise exception 'Seulement si le sujet de la demande est "cot", étoiles devrait être null.';
        end if;
    else
        perform set_config('response.status', '401', true);
        raise 'Accès non autorisé.';
    end if;
end ;
$$;

COMMIT;
