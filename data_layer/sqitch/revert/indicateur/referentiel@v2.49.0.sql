-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

drop function fiche_resume(fiche_action_indicateur);
drop trigger rewrite_indicateur_id on indicateur_resultat;
drop trigger rewrite_indicateur_id on indicateur_objectif;
drop function rewrite_indicateur_id;
drop view indicateurs;
drop type indicateur_valeur_type;
drop table indicateur_resultat_import;
drop table indicateur_thematique_nom;
drop table indicateur_objectif_commentaire;
drop table indicateur_perso_resultat_commentaire;
drop table indicateur_perso_objectif_commentaire;
drop view indicateur_rempli;
drop view if exists indicateur_summary;
drop view indicateurs_collectivite;

alter table indicateur_definition
    add obligation_eci bool not null default false;

alter table indicateur_definition
    drop participation_score;

alter table indicateur_definition
    drop selection;

alter table indicateur_definition
    drop titre_long;

alter table indicateur_definition
    drop parent;

alter table indicateur_definition
    add parent integer
        references indicateur_parent;

alter table indicateur_definition
    drop source;

alter table indicateur_definition
    drop type;

alter table indicateur_definition
    drop thematiques;

alter table indicateur_definition
    drop programmes;

alter table indicateur_definition
    drop column sans_valeur;

alter table indicateur_definition
    add column indicateur_group indicateur_group;

drop type indicateur_programme;
drop type indicateur_thematique;
drop type indicateur_referentiel_type;


alter table indicateur_resultat_commentaire
    rename to indicateur_commentaire;

alter table indicateur_commentaire
    drop constraint unique_collectivite_indicateur_annee;

alter table indicateur_commentaire
    drop annee;

alter table indicateur_commentaire
    add constraint indicateur_commentaire_pkey unique (collectivite_id, indicateur_id);

create view indicateurs_collectivite as
select null      as indicateur_id,
       ipd.id    as indicateur_personnalise_id,
       ipd.titre as nom,
       ipd.description,
       ipd.unite,
       ipd.collectivite_id
from indicateur_personnalise_definition ipd
union
select id.id                                                           as tag_id,
       null                                                            as indicateur_personnalise_id,
       concat(id.indicateur_group, ' ', id.identifiant, ' - ', id.nom) as nom,
       id.description,
       id.unite,
       null                                                            as collectivite_id
from indicateur_definition id;
comment on view indicateurs_collectivite is 'Liste les indicateurs (globaux et personnalisés) d''une collectivite';

create view indicateur_summary
as
with r as (select indicateur_id, collectivite_id, count(*)
           from indicateur_resultat r
           group by indicateur_id, collectivite_id)
select collectivite_id,
       indicateur_id,
       indicateur_group,
       r.count as resultats
from indicateur_definition id
         join r on id.id = r.indicateur_id
where have_lecture_acces(collectivite_id);
comment on view indicateur_summary is 'Permet d''obtenir le nombre de résultats saisis par indicateur pour chaque collectivité.';

COMMIT;
