-- Deploy tet:labellisation/drop_update_labellisation_trigger to pg

-- La labellisation est désormais créée explicitement par le backend
-- (CloseDossierLabellisationService), avec l'étoile et la date décidées en CRA,
-- et non plus silencieusement par ce trigger lors de la mise à jour de l'audit.
-- retool_update_audit, qui comptait sur ce trigger pour acter la labellisation
-- (date_cnl, valide_labellisation), est supprimée : l'outil d'administration
-- remplace Retool.

BEGIN;

drop trigger if exists update_labellisation_before_audit_update on labellisation.audit;
drop function if exists labellisation.update_labellisation();
drop function if exists public.retool_update_audit(integer, timestamptz, timestamptz, timestamptz, boolean, boolean, boolean);

COMMIT;
