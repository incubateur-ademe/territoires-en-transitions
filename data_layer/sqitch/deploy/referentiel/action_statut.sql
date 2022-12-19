-- Deploy tet:action_statut to pg
-- requires: private_schema
-- requires: referentiel
-- requires: collectivites

BEGIN;

create or replace function private.check_avancement_detaille_sum()
    returns trigger as
$$
declare
    total float;
begin
    if new.avancement != 'detaille'
    then
        return new;
    end if;

    select round( sum(t)::numeric, 2 ) from unnest(new.avancement_detaille) t into total;
    if total = 1
    then
        return new;
    else
        raise 'Les 3 parties de l''avancement détaillé devraient sommer à 1';
    end if;
end
$$ language plpgsql;

COMMIT;
