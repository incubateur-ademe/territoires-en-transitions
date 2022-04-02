alter table absract_modified_at
    rename to abstract_modified_at;

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

-- then execute all triggers starting with:
--- create trigger set_modified_at_before_
