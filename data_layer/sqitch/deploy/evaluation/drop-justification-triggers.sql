-- Deploy tet:evaluation/drop-justification-triggers to pg

BEGIN;

drop trigger modified_at
  on public.justification;

drop trigger modified_by
  on public.justification;

COMMIT;
