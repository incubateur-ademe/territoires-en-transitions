-- Deploy tet:collation to pg

BEGIN;

CREATE COLLATION IF NOT EXISTS numeric_with_case_and_accent_insensitive (
    provider = 'icu',
    locale = 'und-u-ks-level1-kn-true',
    deterministic = false
);

COMMIT;
