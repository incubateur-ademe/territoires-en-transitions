-- Deploy tet:utils/modified_at to pg

BEGIN;

create table abstract_modified_at
(
    modified_at timestamp with time zone default CURRENT_TIMESTAMP not null
);
alter table abstract_modified_at
    enable row level security;

create function update_modified_at() returns trigger
as
$$
begin
    new.modified_at = now();
    return new;
end;
$$ language plpgsql;

COMMIT;
