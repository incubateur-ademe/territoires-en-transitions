-- return the columns used to generated python types.
SELECT column_name,
       ordinal_position,
       column_default,
       is_nullable,
       data_type,
       character_maximum_length,
       datetime_precision,
       domain_name,
       udt_name
FROM information_schema.columns
WHERE table_name = :table_name;
