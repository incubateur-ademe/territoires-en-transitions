-- Deploy tet:panier_action_impact/action_impact to pg

BEGIN;

drop function action_impact_typologie(action_impact_state);
drop function action_impact_thematique(action_impact_state);
alter table action_impact_thematique drop column ordre;

drop function action_definition(action_impact_state);
drop function thematique(action_impact_state);
drop function matches_competences(action_impact_state);
drop function action_impact_temps_de_mise_en_oeuvre(action_impact_state);
drop function action_impact_fourchette_budgetaire(action_impact_state);
drop function action_impact_state(panier);
drop table action_impact_state;

alter table action_impact drop column competences_communales;
alter table action_impact drop column independamment_competences;
alter table action_impact drop column typologie_id;

create table action_impact_state
(
    action     action_impact,
    statut     action_impact_statut,
    isinpanier boolean
);
comment on table action_impact_state is
    'L''état d''une action par rapport à un panier. On ne se sert pas de cette table pour stocker des données.';

create function action_impact_state(panier) returns SETOF action_impact_state
    stable
    language sql
BEGIN ATOMIC
SELECT a.*::action_impact AS action,
       ais.*::action_impact_statut AS statut,
       (aip.* IS NOT NULL) AS isinpanier
FROM action_impact a
LEFT JOIN action_impact_panier aip ON aip.action_id = a.id AND aip.panier_id = ($1).id
LEFT JOIN action_impact_statut ais ON ais.action_id = a.id AND ais.panier_id = ($1).id;
END;
comment on function action_impact_state(panier) is 'La liste des actions et de leurs états pour un panier.';

create function action_impact_fourchette_budgetaire(action_impact_state) returns SETOF action_impact_fourchette_budgetaire
    stable
    rows 1
    language sql
BEGIN ATOMIC
SELECT b.niveau,
       b.nom
FROM action_impact_fourchette_budgetaire b
WHERE (b.niveau = ($1).action.fourchette_budgetaire);
END;
comment on function action_impact_fourchette_budgetaire(action_impact_state) is 'La relation entre le state d''une action et sa fourchette budgétaire.';

create function action_impact_temps_de_mise_en_oeuvre(action_impact_state) returns SETOF action_impact_temps_de_mise_en_oeuvre
    stable
    rows 1
    language sql
BEGIN ATOMIC
SELECT meo.niveau,
       meo.nom
FROM action_impact_temps_de_mise_en_oeuvre meo
WHERE (meo.niveau = ($1).action.temps_de_mise_en_oeuvre);
END;
comment on function action_impact_temps_de_mise_en_oeuvre(action_impact_state) is 'La relation entre le state d''une action et son temps de mise en oeuvre.';

create function matches_competences(action_impact_state) returns boolean
    stable
    language sql
BEGIN ATOMIC
SELECT (( SELECT (NOT (EXISTS ( SELECT 1
                                FROM action_impact_banatic_competence c
                                WHERE (c.action_impact_id = ($1).action.id))))) OR ( SELECT action_impact_matches_competences(( SELECT panier.collectivite_id
                                                                                                                                FROM panier
                                                                                                                                WHERE (panier.id = ($1).statut.panier_id)), ($1).action.id) AS action_impact_matches_competences));
END;

create function thematique(action_impact_state) returns SETOF thematique
    stable
    language sql
BEGIN ATOMIC
SELECT t.nom,
       t.id,
       t.md_id
FROM (thematique t
    JOIN action_impact_thematique ait ON ((ait.thematique_id = t.id)))
WHERE (ait.action_impact_id = ($1).action.id);
END;
comment on function thematique(action_impact_state) is 'La relation entre le state d''une action et ses thématiques.';

drop table action_impact_typologie;

drop table action_impact_partenaire;
drop table panier_partenaire;

drop policy allow_read on action_impact_fiche_action;

COMMIT;
