-- Deploy tet:utils/naturalsort to pg

BEGIN;

-- natural sort from http://www.rhodiumtoad.org.uk/junk/naturalsort.sql
create or replace function naturalsort(text)
    returns bytea
    language sql
    immutable strict
as
$f$
select string_agg(convert_to(coalesce(r[2],
                                      length(length(r[1])::text) || length(r[1])::text || r[1]),
                             'SQL_ASCII'), '\x00')
from regexp_matches($1, '0*([0-9]+)|([^0-9]+)', 'g') r;
$f$;

COMMIT;
