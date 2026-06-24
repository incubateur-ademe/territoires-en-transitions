-- Verify tet:collectivite/preferences_referentiel_mode on pg

BEGIN;

do $$
begin
  if exists (
    select 1
    from collectivite
    where preferences -> 'referentiels' ? 'display'
      or not coalesce((preferences -> 'referentiels' -> 'cae') ?& array['display', 'mode'], false)
      or not coalesce((preferences -> 'referentiels' -> 'eci') ?& array['display', 'mode'], false)
      or not coalesce((preferences -> 'referentiels' -> 'te') ?& array['display', 'mode'], false)
  ) then
    raise exception 'legacy collectivite preferences format still present';
  end if;
end $$;

ROLLBACK;
