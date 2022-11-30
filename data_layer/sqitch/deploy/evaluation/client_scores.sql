-- Deploy tet:client_scores to pg
-- requires: referentiel
-- requires: base

BEGIN;

alter publication supabase_realtime drop table client_scores;
comment on table client_scores
    is 'Scores calculés par le business au format json.';

create table client_scores_update
(
    collectivite_id integer references collectivite not null,
    referentiel     referentiel                     not null,
    modified_at     timestamp with time zone        not null,
    primary key (collectivite_id, referentiel)
);
comment on table client_scores_update
    is 'Permet au client d''écouter les changement de scores et de minimiser la payload.';

alter table client_scores_update enable row level security;
create policy allow_read
    on client_scores_update for select
    using (true);
alter publication supabase_realtime add table client_scores_update;

create function evaluation.after_scores_write() returns trigger as
$$
begin
insert into client_scores_update(collectivite_id, referentiel, modified_at)
values (new.collectivite_id, new.referentiel, new.modified_at)
on conflict (collectivite_id, referentiel) do update set modified_at = excluded.modified_at;
return new;
end
$$ language plpgsql security definer;

create trigger on_write
    after insert or update
    on client_scores
    for each row
execute procedure evaluation.after_scores_write();


COMMIT;
