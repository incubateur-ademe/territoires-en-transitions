-- Revert tet:referentiel/add_demande_associated_collectivite_id from pg
--
-- stats.evolution_nombre_labellisations uses SELECT * FROM labellisation; after a
-- revert of stats/drop-old-stats-views that mat view pins labellisation.audit_id.
-- Drop and recreate it here so DROP COLUMN audit_id can run, matching the schema
-- before this migration (same definitions as stats/vues_BI).

BEGIN;

DROP VIEW IF EXISTS public.stats_evolution_nombre_labellisations;
DROP MATERIALIZED VIEW IF EXISTS stats.evolution_nombre_labellisations;

ALTER TABLE labellisation.demande
  DROP COLUMN IF EXISTS associated_collectivite_id;

ALTER TABLE public.labellisation
  DROP COLUMN IF EXISTS audit_id;

CREATE MATERIALIZED VIEW stats.evolution_nombre_labellisations AS
WITH l_details AS (
                  SELECT
                      *,
                      LEAD(l.obtenue_le) OVER (
                          PARTITION BY collectivite_id, referentiel ORDER BY obtenue_le
                          ) AS lead_obtenue_le
                  FROM
                      labellisation l
                  ORDER BY
                      collectivite_id, obtenue_le)
select mb.first_day                                                            as mois,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '1') as etoile_1,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '2') as etoile_2,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '3') as etoile_3,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '4') as etoile_4,
       count(collectivite_id) filter (
           where obtenue_le <= mb.last_day
                     and (lead_obtenue_le > mb.last_day or lead_obtenue_le IS NULL)
                     and obtenue_le>(mb.last_day-interval '4 years')
                     and etoiles = '5') as etoile_5
from stats.monthly_bucket mb
join l_details on true
group by mb.first_day
order by mb.first_day;

CREATE OR REPLACE VIEW public.stats_evolution_nombre_labellisations AS
SELECT mois,
       etoile_1,
       etoile_2,
       etoile_3,
       etoile_4,
       etoile_5
FROM stats.evolution_nombre_labellisations;

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
          COALESCE(snapshot_rec.etoiles, cast(demande_rec.etoiles::text as integer)),
          round((snapshot_rec.point_fait / snapshot_rec.point_potentiel * 100)::numeric, 1),
          round((snapshot_rec.point_programme / snapshot_rec.point_potentiel * 100)::numeric, 1)
        )
		on conflict do nothing;
    end if;

    return new;
end ;
$$ language plpgsql;

COMMIT;
