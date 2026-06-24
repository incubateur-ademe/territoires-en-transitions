-- Deploy tet:collectivite/preferences_referentiel_mode to pg

BEGIN;

alter table collectivite
  alter column preferences set default '{
    "referentiels": {
      "cae": {"display": true, "mode": "write"},
      "eci": {"display": true, "mode": "write"},
      "te": {"display": true, "mode": "readonly"}
    }
  }'::jsonb;

-- migre le format legacy { referentiels: { display: { cae, eci, te } } }
update collectivite
set preferences = jsonb_build_object(
  'referentiels',
  jsonb_build_object(
    'cae',
    jsonb_build_object(
      'display',
      coalesce((preferences -> 'referentiels' -> 'display' ->> 'cae')::boolean, true),
      'mode',
      case
        when coalesce((preferences -> 'referentiels' -> 'display' ->> 'cae')::boolean, true)
        then 'write'
        else 'archived'
      end
    ),
    'eci',
    jsonb_build_object(
      'display',
      coalesce((preferences -> 'referentiels' -> 'display' ->> 'eci')::boolean, true),
      'mode',
      case
        when coalesce((preferences -> 'referentiels' -> 'display' ->> 'eci')::boolean, true)
        then 'write'
        else 'archived'
      end
    ),
    'te',
    jsonb_build_object(
      'display',
      coalesce((preferences -> 'referentiels' -> 'display' ->> 'te')::boolean, true),
      'mode',
      'readonly'
    )
  )
)
where preferences -> 'referentiels' ? 'display';

COMMIT;
