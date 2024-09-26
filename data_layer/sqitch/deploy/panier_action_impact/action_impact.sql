-- Deploy tet:panier_action_impact/action_impact to pg

BEGIN;

create table panier_partenaire
(
    id serial primary key,
    nom text
);

create table action_impact_partenaire
(
    action_impact_id integer references action_impact,
    partenaire_id integer references panier_partenaire,
    primary key (action_impact_id, partenaire_id)
);

create table action_impact_typologie
(
    id serial primary key,
    nom text not null
);

create policy allow_read on action_impact_fiche_action
    for select using (peut_lire_la_fiche(fiche_id));

drop function thematique(action_impact_state);
drop function matches_competences(action_impact_state);
drop function action_impact_temps_de_mise_en_oeuvre(action_impact_state);
drop function action_impact_fourchette_budgetaire(action_impact_state);
drop function action_impact_state(panier);
drop table action_impact_state;

alter table action_impact add column competences_communales boolean default false not null;
alter table action_impact add column independamment_competences boolean default false not null;
alter table action_impact add column typologie_id integer references action_impact_typologie;

create table action_impact_state
(
    action     action_impact,
    statut     action_impact_statut,
    isinpanier boolean,
    panier panier
);
comment on table action_impact_state is
    'L''état d''une action par rapport à un panier. On ne se sert pas de cette table pour stocker des données.';

create function action_impact_state(panier) returns SETOF action_impact_state
    stable
    language sql
BEGIN ATOMIC
SELECT a.*::action_impact AS action,
       ais.*::action_impact_statut AS statut,
       (aip.* IS NOT NULL) AS isinpanier,
       ($1) as panier
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
    security definer
BEGIN ATOMIC
with collectivite_panier as (
                            SELECT coalesce(($1).panier.collectivite_id, ($1).panier.collectivite_preset) as collectivite_id
                            )
SELECT case
           when e is not null then
               not (($1).action.competences_communales) and
               (
                   (
                   SELECT (
                              NOT (
                                  EXISTS (
                                         SELECT 1
                                         FROM action_impact_banatic_competence c
                                         WHERE (c.action_impact_id = ($1).action.id)
                                         )
                                  )
                              )
                   )
                       OR
                   (
                   SELECT action_impact_matches_competences(
                                  (
                                  SELECT collectivite_id
                                  FROM collectivite_panier
                                  LIMIT 1
                                  ),
                                  ($1).action.id
                          ) AS action_impact_matches_competences
                   )
                   )
           when c is not null then
               ($1).action.competences_communales or ($1).action.independamment_competences
           else
               true
       end as result
FROM collectivite_panier cp
LEFT JOIN epci e on cp.collectivite_id = e.collectivite_id
LEFT JOIN commune c on cp.collectivite_id = c.collectivite_id;
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

create function action_definition(action_impact_state) returns SETOF action_definition
    stable
    language sql
    security definer
BEGIN ATOMIC
SELECT ad.*
FROM action_definition ad
JOIN action_impact_action aia on ad.action_id = aia.action_id
WHERE (aia.action_impact_id = ($1).action.id);
END;
comment on function action_definition(action_impact_state) is 'La relation entre le state d''une action et ses actions du référentiel.';


COMMIT;
