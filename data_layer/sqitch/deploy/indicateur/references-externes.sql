-- Deploy tet:indicateur/references-externes to pg
-- requires: indicateur/fusion
BEGIN;

CREATE TABLE public.indicateur_reference_externe (
    source text NOT NULL CHECK (source <> '' AND source = btrim(source)),
    code_externe text NOT NULL CHECK (code_externe <> '' AND code_externe = btrim(code_externe)),
    indicateur_id integer REFERENCES public.indicateur_definition(id) ON DELETE CASCADE,
    lien_source text NOT NULL CHECK (lien_source <> '' AND lien_source = btrim(lien_source)),
    version text NOT NULL,
    PRIMARY KEY (source, code_externe)
);
CREATE INDEX indicateur_reference_externe_indicateur_id_idx
    ON public.indicateur_reference_externe (indicateur_id);

-- Publication par le backend ; aucune écriture directe depuis le client Supabase.
ALTER TABLE public.indicateur_reference_externe ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.indicateur_reference_externe FROM anon, authenticated;
GRANT ALL ON public.indicateur_reference_externe TO service_role;

COMMIT;
