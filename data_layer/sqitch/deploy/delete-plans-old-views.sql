-- Deploy tet:delete-plans-old-views to pg

BEGIN;


DROP function if exists public.plan_action_export;
DROP function if exists private.plan_action_export;

DROP function if exists public.filter_fiches_action;
DROP function if exists public.upsert_axe;

DROP VIEW if exists public.fiches_action;
DROP VIEW if exists private.fiches_action;

DROP function if exists public.upsert_fiche_action;

DROP function if exists public.fiche_resume(fiche_action_indicateur fiche_action_indicateur);
DROP function if exists public.fiche_resume(fiche_action_action fiche_action_action);

DROP VIEW if exists public.fiche_resume;
DROP VIEW if exists private.fiche_resume;

DROP view if exists public.fiche_action_personne_referente;

DROP view if exists public.plan_action;

COMMIT;
