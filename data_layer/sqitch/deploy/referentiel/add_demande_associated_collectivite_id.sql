-- Deploy tet:referentiel/add_demande_associated_collectivite_id to pg

BEGIN;

ALTER TABLE labellisation.demande
  ADD COLUMN IF NOT EXISTS associated_collectivite_id INTEGER
  REFERENCES public.collectivite(id);

ALTER TABLE public.labellisation
  ADD COLUMN IF NOT EXISTS audit_id INTEGER
  REFERENCES labellisation.audit(id);

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

COMMIT;
