-- Revert tet:collectivite/preferences_referentiel_mode from pg

BEGIN;

update collectivite
set preferences = jsonb_build_object(
  'referentiels',
  jsonb_build_object(
    'display',
    jsonb_build_object(
      'cae', (preferences -> 'referentiels' -> 'cae' ->> 'display')::boolean,
      'eci', (preferences -> 'referentiels' -> 'eci' ->> 'display')::boolean,
      'te', (preferences -> 'referentiels' -> 'te' ->> 'display')::boolean
    )
  )
)
where preferences -> 'referentiels' -> 'cae' ? 'mode';

alter table collectivite
  alter column preferences set default '{"referentiels":{"display":{"cae":true,"eci":true,"te":true}}}'::jsonb;

COMMIT;
