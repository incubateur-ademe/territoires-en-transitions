-- Verify tet:plan_action/fiches on pg

BEGIN;

select has_function_privilege(
               'filter_fiches_action(
               integer,
               boolean,
               integer[],
               boolean,
               personne[],
               boolean,
               personne[],
               boolean,
               fiche_action_niveaux_priorite[],
               boolean,
               fiche_action_statuts[],
               boolean,
               thematique[],
               boolean,
               sous_thematique[],
               boolean,
               integer,
               integer,
               boolean,
               timestamptz,
               timestamptz,
               fiche_action_echeances,
               integer
               )'
           , 'execute');

ROLLBACK;
