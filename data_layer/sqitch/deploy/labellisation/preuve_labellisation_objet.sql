-- Deploy tet:labellisation/preuve_labellisation_objet to pg

BEGIN;

create type labellisation.objet_preuve as enum ('acte_engagement', 'candidature');

alter table public.preuve_labellisation
    add column objet labellisation.objet_preuve;

comment on column public.preuve_labellisation.objet
    is 'La pièce déposée : acte d''engagement, attendu pour la première étoile, ou document de candidature, attendu à partir de la deuxième. Null quand le dépôt ne précise pas l''objet — dépôts antérieurs à la distinction, et dépôts depuis l''ancien écran de labellisation qui continue de ne pas le renseigner. La pièce n''est alors rattachée à aucune section de la checklist et ne satisfait aucun critère.';

COMMIT;
