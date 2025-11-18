-- Deploy tet:referentiel/add_audit_etoiles to pg

BEGIN;

ALTER TABLE labellisation.audit
  ADD COLUMN etoiles_validees INTEGER
  CHECK (etoiles_validees IS NULL OR (etoiles_validees >= 1 AND etoiles_validees <= 5));

UPDATE labellisation.audit a
  SET etoiles_validees = temp.etoiles_validees::integer
  FROM (
  	SELECT 
  	audit_id,
  	referentiel_scores->'scores'->'score'->>'etoiles' as etoiles_validees
  	FROM score_snapshot ss
  	LEFT JOIN labellisation.audit a
  	ON ss.audit_id  = a.id 
  	WHERE ss.audit_id is not null
  	AND ss.type_jalon = 'post_audit'
  	AND a.clos = true
  	AND a.valide = true
  	AND a.valide_labellisation = true
  ) AS temp
  WHERE a.id = temp.audit_id;

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
          score_programme
        ) values (
          new.collectivite_id,
          new.referentiel,
          new.date_cnl,
          COALESCE(new.etoiles_validees, cast(demande_rec.etoiles::text as integer)),
          round((snapshot_rec.point_fait / snapshot_rec.point_potentiel * 100)::numeric, 1),
          round((snapshot_rec.point_programme / snapshot_rec.point_potentiel * 100)::numeric, 1)
        )
		on conflict do nothing;
    end if;

    return new;
end ;
$$ language plpgsql;

-- We have to recreate this view & function otherwise a lot of RLS impact because the function is used by est_auditeur
CREATE OR REPLACE VIEW public.audit
AS SELECT *
   FROM labellisation.audit
  WHERE is_authenticated() OR is_service_role();

CREATE OR REPLACE FUNCTION labellisation.active_audit(collectivite_id integer, referentiel referentiel)
 RETURNS labellisation.audit
 LANGUAGE sql
BEGIN ATOMIC
 SELECT *
    FROM audit a
   WHERE ((a.collectivite_id = active_audit.collectivite_id) AND (a.referentiel = active_audit.referentiel) AND (NOT a.clos) AND (a.date_debut IS NOT NULL));
END
;

COMMIT;
