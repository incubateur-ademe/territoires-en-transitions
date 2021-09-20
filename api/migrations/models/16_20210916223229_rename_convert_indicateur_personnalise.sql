-- upgrade --
alter table indicateurpersonnalisevalue
    alter column value drop not null;
update indicateurpersonnalisevalue
set value = replace(value, ',', '.');
update indicateurpersonnalisevalue
set value = replace(value, ' ', '');
update indicateurpersonnalisevalue
set value = replace(value, '€', '');
update indicateurpersonnalisevalue
set value = regexp_replace(value, '[^0-9\.]+', '');
update indicateurpersonnalisevalue
set value = NULLIF(value, '');

alter table indicateurpersonnalisevalue
    alter column value type double precision using value::double precision;


ALTER TABLE IF EXISTS "indicateurpersonnalisevalue"
    RENAME TO "indicateurpersonnaliseresultat";


-- downgrade --
ALTER TABLE IF EXISTS "indicateurpersonnaliseresultat"
    ALTER COLUMN "value" TYPE VARCHAR(36) USING "value"::VARCHAR(36);
ALTER TABLE IF EXISTS "indicateurpersonnaliseresultat"
    RENAME TO "indicateurpersonnalisevalue";

