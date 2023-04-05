-- Deploy tet:plan_action to pg

BEGIN;

create or replace function peut_lire_la_fiche(fiche_id integer) returns boolean as
$$
begin
    return can_read_acces_restreint((select fa.collectivite_id from fiche_action fa where fa.id = fiche_id limit 1));
end;
$$ language plpgsql security definer;

COMMIT;
