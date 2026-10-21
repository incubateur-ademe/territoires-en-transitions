-- Deploy tet:referentiel/add_action_definition_templates to pg

BEGIN;

alter table action_definition
  add column templates jsonb;
comment on column action_definition.templates is
  'Textes sources des seuls champs qui contiennent des balises {{si …}}, par champ (ex. {"nom": "…{{si dom}}…{{/si}}"}). Les colonnes de texte contiennent le rendu par défaut (profil métropole). Null si aucun champ n''est balisé.';

COMMIT;
