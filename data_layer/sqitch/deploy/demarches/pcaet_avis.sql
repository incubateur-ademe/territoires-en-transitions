-- Deploy tet:demarches/pcaet_avis to pg

BEGIN;

CREATE TABLE public.demarche_pcaet_demande_avis (
    id                          integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    demarche_id                 integer     NOT NULL REFERENCES public.demarche(id) ON DELETE RESTRICT,
    instructeur_collectivite_id integer     NOT NULL REFERENCES public.collectivite(id) ON DELETE CASCADE,
    source                      text        NOT NULL CHECK (source IN ('seed', 'transmission')),
    created_at                  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT demarche_pcaet_demande_avis_unique_demarche_instructeur UNIQUE (demarche_id, instructeur_collectivite_id)
);

COMMENT ON TABLE public.demarche_pcaet_demande_avis IS 'Demande d''avis créée à la transmission d''une démarche : une par (démarche, collectivité instructrice). C''est ce que liste le tableau de bord instructeur ; « à traiter / traité » se déduit, aucune colonne d''état. Le dossier lui-même n''est pas recopié : l''instructeur lit directement les données de la collectivité (décision « lecture directe » du 2026-08-11).';
COMMENT ON COLUMN public.demarche_pcaet_demande_avis.demarche_id IS 'La démarche instruite — ON DELETE RESTRICT : une démarche dont l''instruction a commencé n''est pas supprimable.';
COMMENT ON COLUMN public.demarche_pcaet_demande_avis.instructeur_collectivite_id IS 'La collectivité instructrice destinataire — type instructeur obligatoire (trigger).';
COMMENT ON COLUMN public.demarche_pcaet_demande_avis.source IS 'seed | transmission — provenance de la ligne (v1 : seed ; le futur backend de transmission écrira la même table).';

CREATE INDEX demarche_pcaet_demande_avis_instructeur
    ON public.demarche_pcaet_demande_avis (instructeur_collectivite_id);

CREATE TABLE public.demarche_pcaet_avis (
    id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    demande_avis_id          integer     NOT NULL REFERENCES public.demarche_pcaet_demande_avis(id) ON DELETE CASCADE,
    emetteur_collectivite_id integer     NOT NULL REFERENCES public.collectivite(id) ON DELETE CASCADE,
    au_titre_de              text        NOT NULL CHECK (au_titre_de IN ('prefet_region', 'autorite_environnementale')),
    sens                     text        NOT NULL CHECK (sens IN ('favorable', 'avec_reserves', 'defavorable')),
    fichier_ref              text        NULL,
    valide_le                timestamptz NULL,
    depose_par               uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    depose_le                timestamptz NOT NULL DEFAULT now(),
    modifie_le               timestamptz NULL,
    envoye_le                timestamptz NULL,
    CONSTRAINT demarche_pcaet_avis_valide_avec_piece_jointe CHECK (valide_le IS NULL OR fichier_ref IS NOT NULL),
    CONSTRAINT demarche_pcaet_avis_unique_au_titre_de UNIQUE (demande_avis_id, au_titre_de)
);

COMMENT ON TABLE public.demarche_pcaet_avis IS 'Avis d''un service instructeur sur une démarche : sens + pièce jointe. Un avis par « au titre de », soit 0 à 2 par demande en v1, la même PJ pouvant être partagée. L''absence d''avis est un état normal.';
COMMENT ON COLUMN public.demarche_pcaet_avis.emetteur_collectivite_id IS 'La collectivité émettrice — garde-fou « émetteur dès la v1 » ; type instructeur obligatoire (trigger).';
COMMENT ON COLUMN public.demarche_pcaet_avis.au_titre_de IS 'prefet_region | autorite_environnementale — la DREAL peut porter les deux titres.';
COMMENT ON COLUMN public.demarche_pcaet_avis.sens IS 'favorable | avec_reserves | defavorable — toujours renseigné, y compris en brouillon (choix de radio).';
COMMENT ON COLUMN public.demarche_pcaet_avis.fichier_ref IS 'Référence de la PJ dans le bucket de la collectivité émettrice ; nullable pour permettre un brouillon sans PJ, obligatoire à la validation (contrainte).';
COMMENT ON COLUMN public.demarche_pcaet_avis.valide_le IS 'NULL = brouillon (travail interne) ; renseigné = avis officiel, modifiable jusqu''à l''échéance mais non supprimable.';
COMMENT ON COLUMN public.demarche_pcaet_avis.depose_par IS 'Auteur du dépôt de l''avis ; SET NULL à la suppression du compte pour préserver l''acte officiel.';
COMMENT ON COLUMN public.demarche_pcaet_avis.envoye_le IS 'Trace de la notification email au référent de la collectivité (l''objet et le message sont des données de transport, non persistées).';

CREATE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur() RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    cible_id   integer;
    cible_type text;
BEGIN
    cible_id := (to_jsonb(NEW) ->> TG_ARGV[0])::integer;
    SELECT type INTO cible_type FROM public.collectivite WHERE id = cible_id;
    IF cible_type IS NULL OR cible_type NOT IN ('dreal') THEN
        RAISE EXCEPTION 'La collectivité % n''est pas d''un type instructeur (type : %)',
            cible_id, COALESCE(cible_type, 'introuvable');
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER check_instructeur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_demande_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur('instructeur_collectivite_id');

CREATE TRIGGER check_emetteur
    BEFORE INSERT OR UPDATE ON public.demarche_pcaet_avis
    FOR EACH ROW
    EXECUTE FUNCTION public.demarche_pcaet_check_collectivite_est_instructeur('emetteur_collectivite_id');

ALTER TABLE public.demarche_pcaet_demande_avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demarche_pcaet_avis ENABLE ROW LEVEL SECURITY;

COMMIT;
