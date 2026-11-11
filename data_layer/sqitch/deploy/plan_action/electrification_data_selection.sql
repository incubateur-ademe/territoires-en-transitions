BEGIN;

CREATE TABLE public.electrification_data_selection (
  kind text PRIMARY KEY CHECK (kind IN ('catalogue', 'laureats')),
  version text NOT NULL CHECK (length(trim(version)) > 0),
  revision uuid NOT NULL DEFAULT gen_random_uuid(),
  metadata jsonb NOT NULL CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.electrification_data_selection IS
  'Selection transactionnelle des versions immuables du catalogue et des laureats Electrification.';

ALTER TABLE public.electrification_data_selection ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.electrification_data_selection FROM anon, authenticated;
GRANT ALL ON public.electrification_data_selection TO service_role;

-- Conserver les sélections déjà publiées en recette, sans modifier Storage.
INSERT INTO public.electrification_data_selection (kind, version, metadata)
SELECT split_part(name, '/', 1), user_metadata->>'version', user_metadata
FROM storage.objects
WHERE bucket_id = 'plans-electrification-data'
  AND name IN ('catalogue/active.json', 'laureats/active.json')
  AND jsonb_typeof(user_metadata->'version') = 'string'
  AND length(trim(user_metadata->>'version')) > 0;

COMMIT;
