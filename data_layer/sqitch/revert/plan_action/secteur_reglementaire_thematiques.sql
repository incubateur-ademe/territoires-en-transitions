-- Revert tet:plan_action/secteur_reglementaire_thematiques from pg

BEGIN;

-- Postgres ne sait pas retirer une valeur d'enum : on reconstruit le type.
-- Une fiche dont tous les secteurs sont retires redevient jamais demandee a
-- Communs, plutot que non attribuable.
DELETE FROM public.fiche_action_secteur_attribution
WHERE secteurs <> '{}'
  AND secteurs <@ ARRAY ['amenagement', 'biodiversite', 'eau', 'foret_et_sols', 'economie', 'sante', 'risques_naturels']::public.secteur_reglementaire[];

UPDATE public.fiche_action_secteur_attribution
SET secteurs = ARRAY(
    SELECT secteur
    FROM unnest(secteurs) AS secteur
    WHERE secteur::text IN ('residentiel', 'tertiaire', 'transport_routier', 'autres_transports',
                            'agriculture', 'dechets', 'industrie_hors_branche_energie', 'branche_energie')
)
WHERE secteurs && ARRAY ['amenagement', 'biodiversite', 'eau', 'foret_et_sols', 'economie', 'sante', 'risques_naturels']::public.secteur_reglementaire[];

-- La contrainte compare secteurs a un tableau du type : elle ne survit pas au changement de type.
ALTER TABLE public.fiche_action_secteur_attribution
    DROP CONSTRAINT fiche_action_secteur_attribution_indisponible_check;

ALTER TYPE public.secteur_reglementaire RENAME TO secteur_reglementaire_old;

CREATE TYPE public.secteur_reglementaire AS ENUM (
    'residentiel',
    'tertiaire',
    'transport_routier',
    'autres_transports',
    'agriculture',
    'dechets',
    'industrie_hors_branche_energie',
    'branche_energie'
);

COMMENT ON TYPE public.secteur_reglementaire IS
  'Secteurs reglementaires de l article R. 229-52 du code de l environnement, avec les codes de l API Communs.';

ALTER TABLE public.fiche_action_secteur_attribution
    ALTER COLUMN secteurs TYPE public.secteur_reglementaire[]
        USING secteurs::text[]::public.secteur_reglementaire[],
    ADD CONSTRAINT fiche_action_secteur_attribution_indisponible_check
        CHECK (origine <> 'indisponible' OR secteurs = '{}');

DROP TYPE public.secteur_reglementaire_old;

COMMIT;
