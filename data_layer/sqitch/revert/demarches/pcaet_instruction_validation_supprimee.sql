-- Revert tet:demarches/pcaet_instruction_validation_supprimee from pg

BEGIN;

CREATE TABLE public.demarche_pcaet_instruction_validation (
    id              integer     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    demande_avis_id integer     NOT NULL REFERENCES public.demarche_pcaet_demande_avis(id) ON DELETE CASCADE,
    partie          text        NOT NULL CHECK (partie IN ('documents', 'diagnostic', 'plan')),
    valide_par      uuid        NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    valide_le       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT demarche_pcaet_instruction_validation_unique_partie UNIQUE (demande_avis_id, partie)
);

COMMENT ON TABLE public.demarche_pcaet_instruction_validation IS 'Avancement de l''instruction d''une demande d''avis : une ligne = une partie du dossier validée par l''instructeur (parcours en trois étapes des maquettes). Dévalider = supprimer la ligne. Les validations restent acquises quand la collectivité retransmet le dossier.';
COMMENT ON COLUMN public.demarche_pcaet_instruction_validation.partie IS 'documents | diagnostic | plan — les clés du parcours d''instruction, alignées sur les sections du stepper.';
COMMENT ON COLUMN public.demarche_pcaet_instruction_validation.valide_par IS 'Auteur de la validation ; SET NULL à la suppression du compte.';

ALTER TABLE public.demarche_pcaet_instruction_validation ENABLE ROW LEVEL SECURITY;

COMMIT;
