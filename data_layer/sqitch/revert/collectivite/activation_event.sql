-- Revert tet:collectivite/activation_event from pg

BEGIN;


alter publication supabase_realtime drop table collectivite_activation_event;
drop trigger before_collectivite_activation_insert_write_event on private_utilisateur_droit;
drop function before_collectivite_activation_insert_write_event();
drop table collectivite_activation_event;

COMMIT;
