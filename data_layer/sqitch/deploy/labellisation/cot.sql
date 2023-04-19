-- Deploy tet:labellisation/cot to pg

BEGIN;

alter table cot
    add column
        signataire integer references collectivite;
comment on column cot.signataire is
    'La collectivité elle-même ou la collectivité supra.';

update cot
set signataire = cot.collectivite_id;

create function before_insert_add_default_signataire() returns trigger
as
$$
begin
    if new.signataire is null then
        new.signataire = new.collectivite_id;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger before_insert
    before insert
    on cot
    for each row
execute procedure before_insert_add_default_signataire();

COMMIT;
