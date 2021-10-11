-- upgrade --
alter table indicateurvalue
    alter column value drop not null;
update indicateurvalue
set value = replace(value, ',', '.');
update indicateurvalue
set value = replace(value, ' ', '');
update indicateurvalue
set value = replace(value, '€', '');
update indicateurvalue
set value = regexp_replace(value, '[^0-9\.]+', '');
update indicateurvalue
set value = NULLIF(value, '');

alter table indicateurvalue
    alter column value type double precision using value::double precision;


ALTER TABLE IF EXISTS "indicateurvalue"
    RENAME TO "indicateurresultat";


-- downgrade --
ALTER TABLE IF EXISTS "indicateurresultat"
    ALTER COLUMN "value" TYPE VARCHAR(36) USING "value"::VARCHAR(36);
ALTER TABLE IF EXISTS "indicateurresultat"
    RENAME TO "indicateurvalue";

