-- Revert tet:base from pg

begin;
drop table if exists absract_modified_at;
drop function if exists teapot();
drop function if exists is_authenticated();
drop function if exists is_service_role();
commit;
