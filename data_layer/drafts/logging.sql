-- keep a log of updates.
create table action_statut_log
(
    logged_at timestamp with time zone default CURRENT_TIMESTAMP not null
) inherits (action_statut_store);


create function action_statut_insert() returns trigger as $$
    declare
    begin
        -- todo delete recently archived statut from the same user

        -- read action statut and copy it into action statut log
        insert into action_statut_log values((OLD).*);
        return null;
    end;
$$ language 'plpgsql';

create trigger action_statut_insert_trigger
    before update on action_statut_store
    for each row execute procedure action_statut_insert();
