-- Deploy tet:indicateur/calcul_indicateur to pg

BEGIN;

alter table indicateur_valeur
  add column calcul_auto boolean default false,
  -- Une table de relation aurait pu être utilisée mais uniquement de la traçabilité donc au plus simple
  add column calcul_auto_identifiants_manquants text[];

COMMIT;
