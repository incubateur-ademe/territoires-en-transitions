-- Revert tet:labellisation/drop_update_labellisation_trigger from pg

BEGIN;

create or replace function
  labellisation.update_labellisation()
    returns trigger
    security definer
as
$$
declare
  demande_rec RECORD;
  snapshot_rec RECORD;
begin
    -- charge la demande associée à l'audit
    select into demande_rec *
      from labellisation.demande ld
      where ld.id = new.demande_id;
    if not found then
      raise log 'demande % not found', new.demande_id;
      return new;
    end if;

    -- charge le snapshot associé à l'audit (il doit avoir été créé par
    -- `ValidateAuditService.validateAudit`)
    select into snapshot_rec *
      from score_snapshot s
      where s.audit_id = new.id and s.type_jalon = 'post_audit';
    if not found then
      raise log 'post_audit snapshot % not found', new.id;
      return new;
    end if;

    -- si l'audit est dans le cadre d'une demande de labellisation
    -- et que l'audit est clôturé, validé
    -- et que la labellisation est actée avec une date valide
    if (
        demande_rec.sujet in ('labellisation', 'labellisation_cot')
        and new.clos
        and new.valide
        and new.valide_labellisation
        and new.date_cnl is not null
      )
    then -- alors on insère la ligne dans la table labellisation
        insert into public.labellisation (
          collectivite_id,
          referentiel,
          obtenue_le,
          etoiles,
          score_realise,
          score_programme,
          audit_id
        ) values (
          new.collectivite_id,
          new.referentiel,
          new.date_cnl,
          COALESCE(snapshot_rec.etoiles, cast(demande_rec.etoiles::text as integer)),
          round((snapshot_rec.point_fait / snapshot_rec.point_potentiel * 100)::numeric, 1),
          round((snapshot_rec.point_programme / snapshot_rec.point_potentiel * 100)::numeric, 1),
          new.id
        )
		on conflict do nothing;

        if demande_rec.associated_collectivite_id is not null then
          insert into public.labellisation (
            collectivite_id,
            referentiel,
            obtenue_le,
            etoiles,
            score_realise,
            score_programme,
            audit_id
          ) values (
            demande_rec.associated_collectivite_id,
            new.referentiel,
            new.date_cnl,
            COALESCE(snapshot_rec.etoiles, cast(demande_rec.etoiles::text as integer)),
            round((snapshot_rec.point_fait / snapshot_rec.point_potentiel * 100)::numeric, 1),
            round((snapshot_rec.point_programme / snapshot_rec.point_potentiel * 100)::numeric, 1),
            new.id
          ) on conflict do nothing;
        end if;
    end if;

    return new;
end ;
$$ language plpgsql;

create trigger update_labellisation_before_audit_update
    before update
    on labellisation.audit
    for each row
execute procedure labellisation.update_labellisation();

create or replace function retool_update_audit(
    audit_id integer,
    date_debut timestamptz,
    date_fin timestamptz,
    date_cnl timestamptz,
    valide boolean,
    valide_labellisation boolean,
    clos boolean
) returns void
    language plpgsql
    security definer
as
$$
begin
    if not is_service_role() then
        perform set_config('response.status', '401', true);
        raise 'Seul le service role peut modifier directement l''audit';
    end if;

    if date_debut is not null then
        update labellisation.audit
        set date_debut = retool_update_audit.date_debut
        where id = retool_update_audit.audit_id;
    end if;

    if date_fin is not null then
        update labellisation.audit
        set date_fin = retool_update_audit.date_fin
        where id = retool_update_audit.audit_id;
    end if;

    if date_cnl is not null then
        update labellisation.audit
        set date_cnl = retool_update_audit.date_cnl
        where id = retool_update_audit.audit_id;
    end if;

    if valide is not null then
        update labellisation.audit
        set valide = retool_update_audit.valide
        where id = retool_update_audit.audit_id;
    end if;

    if valide_labellisation is not null then
        update labellisation.audit
        set valide_labellisation = retool_update_audit.valide_labellisation
        where id = retool_update_audit.audit_id;
    end if;

    if clos is not null then
        update labellisation.audit
        set clos = retool_update_audit.clos
        where id = retool_update_audit.audit_id;
    end if;

end
$$;

COMMIT;
