-- Deploy tet:plan_action to pg

BEGIN;

alter type fiche_action_cibles
    add value if not exists 'Public Scolaire'
        after 'Grand public et associations';
alter type fiche_action_cibles
    add value if not exists 'Acteurs économiques du secteur primaire';
alter type fiche_action_cibles
    add value if not exists 'Acteurs économiques du secteur secondaire';
alter type fiche_action_cibles
    add value if not exists 'Acteurs économiques du secteur tertiaire';
alter type fiche_action_cibles
    add value if not exists 'Partenaires';
alter type fiche_action_cibles
    add value if not exists 'Collectivité elle-même';
alter type fiche_action_cibles
    add value if not exists 'Elus locaux';
alter type fiche_action_cibles
    add value if not exists 'Agents';

COMMIT;
