-- Deploy tet:referentiel/score_snapshot to pg

BEGIN;

-- ↓↓ DROP ↓↓ - Drop unecessary triggers
DROP TRIGGER IF EXISTS after_save_snapshot ON client_scores;
DROP FUNCTION IF EXISTS public.after_client_scores_save_snapshot();

DROP TRIGGER IF EXISTS after_save_snapshot ON post_audit_scores;
DROP FUNCTION IF EXISTS public.after_post_audit_scores_save_snapshot();

DROP TRIGGER IF EXISTS after_save_snapshot ON pre_audit_scores;
DROP FUNCTION IF EXISTS public.after_pre_audit_scores_save_snapshot();
-- ↑↑ DROP ↑↑


-- ↓↓ DROP ↓↓ - Drop unecessary function
-- La function PG de recalcul du score (avec l'option "depuis_sauvegarde") n'est plus nécessaire car
-- le recalcul du score est désormais fait côté code lors de la mise à jour des statuts des actions
-- ou de la personnalisation
DROP function automatisation.save_score_snapshot(
	collectivite_id integer,
	referentiel referentiel,
	jalon varchar,
	audit_id integer,
  out status integer
);
-- ↑↑ DROP ↑↑


-- ↓↓ DROP ↓↓ - Drop deprecated and unused functions
DROP FUNCTION IF EXISTS public.action_preuve(id action_id, OUT id action_id, OUT preuve text);
-- ↑↑ DROP ↑↑

COMMIT;
