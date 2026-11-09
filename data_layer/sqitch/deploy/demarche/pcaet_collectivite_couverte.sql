-- Deploy tet:demarche/pcaet_collectivite_couverte to pg
-- requires: demarche/pcaet_bilan_mi_parcours

-- Les EPCI couverts par le PCAET d'un Supra (PETR, pôle métropolitain,
-- syndicat mixte). Le dépôt reste celui du porteur, `demarche.collectivite_id` ;
-- les EPCI à fiscalité propre qu'il couvre, et qui restent juridiquement
-- obligés, viennent ici.
--
-- Le périmètre se fixe à la création du dépôt et ne se modifie plus ensuite.
-- La règle « un seul PCAET en cours par EPCI » dépend du statut de la démarche :
-- elle se vérifie dans le backend, pas par une contrainte ici.

BEGIN;

CREATE TABLE public.demarche_pcaet_collectivite_couverte (
    demarche_id     integer     NOT NULL REFERENCES public.demarche (id) ON DELETE CASCADE,
    collectivite_id integer     NOT NULL REFERENCES public.collectivite (id) ON DELETE CASCADE,
    created_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid        NULL,
    PRIMARY KEY (demarche_id, collectivite_id)
);

CREATE INDEX demarche_pcaet_collectivite_couverte_collectivite_id_idx
    ON public.demarche_pcaet_collectivite_couverte (collectivite_id);

COMMENT ON TABLE public.demarche_pcaet_collectivite_couverte IS
    'EPCI à fiscalité propre couverts par le PCAET d''un Supra (PETR, pôle métropolitain, syndicat mixte). Fixé à la création du dépôt.';

-- Garde-fou : on ne couvre qu'un EPCI à fiscalité propre, et jamais le porteur
-- lui-même. Le backend le vérifie déjà ; la base refuse une écriture qui
-- passerait à côté.
CREATE FUNCTION public.demarche_pcaet_collectivite_couverte_check()
    RETURNS trigger
    LANGUAGE plpgsql
AS $$
DECLARE
    porteur_id integer;
    nature     text;
BEGIN
    SELECT d.collectivite_id INTO porteur_id
    FROM public.demarche AS d
    WHERE d.id = NEW.demarche_id;

    IF porteur_id = NEW.collectivite_id THEN
        RAISE EXCEPTION 'la collectivite #% porte la démarche #% : elle ne peut pas s''y couvrir elle-même',
            NEW.collectivite_id, NEW.demarche_id;
    END IF;

    SELECT c.nature_insee INTO nature
    FROM public.collectivite AS c
    WHERE c.id = NEW.collectivite_id;

    IF nature IS NULL OR nature NOT IN ('CC', 'CA', 'CU', 'METRO', 'EPT') THEN
        RAISE EXCEPTION 'la collectivite #% (nature %) n''est pas un EPCI à fiscalité propre',
            NEW.collectivite_id, coalesce(nature, 'inconnue');
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER demarche_pcaet_collectivite_couverte_check
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_collectivite_couverte
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_collectivite_couverte_check();

-- RLS sans policy : seul le backend (connexion directe) lit et écrit.
ALTER TABLE public.demarche_pcaet_collectivite_couverte ENABLE ROW LEVEL SECURITY;

-- `public` est exposé à PostgREST, et Supabase y accorde par défaut l'accès à
-- anon/authenticated.
REVOKE ALL ON public.demarche_pcaet_collectivite_couverte FROM anon, authenticated;

COMMIT;
