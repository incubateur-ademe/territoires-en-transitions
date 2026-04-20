-- Deploy tet:panier_action_impact/drop_plan_from_panier to pg
-- La fonction plan_from_panier est remplacée par l'endpoint tRPC paniers.checkout
-- du backend NestJS. La colonne axe.panier_id est conservée car elle est
-- toujours écrite par le nouveau flow (via PanierRepository.linkPlanToPanier).

BEGIN;

drop function if exists public.plan_from_panier(int, uuid);
drop function if exists public.plan_from_panier(int, uuid, integer);

COMMIT;
