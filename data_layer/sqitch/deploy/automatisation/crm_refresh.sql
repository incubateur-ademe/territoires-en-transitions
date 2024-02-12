-- Deploy tet:automatisation/crm_refresh to pg

BEGIN;

create function stats.refresh_views_crm() returns void
    security definer
    language plpgsql
as
$$
begin
    refresh materialized view stats.crm_usages;
end ;
$$;


COMMIT;
