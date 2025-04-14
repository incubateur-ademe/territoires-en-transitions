-- Revert tet:indicateur/calcul_indicateur from pg

BEGIN;

alter table indicateur_valeur
  drop column calcul_auto,
  drop column calcul_auto_identifiants_manquants;

COMMIT;
