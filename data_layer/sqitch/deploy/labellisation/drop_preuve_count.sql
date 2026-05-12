-- Deploy tet:labellisation/drop_preuve_count to pg
-- La fonction public.preuve_count est remplacée par le point tRPC
-- referentiels.actions.countPreuves du backend NestJS.

BEGIN;

drop function if exists public.preuve_count(integer, action_id);

COMMIT;
