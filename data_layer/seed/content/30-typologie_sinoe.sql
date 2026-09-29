-- Typologie SINOE (ADEME) des communes et EPCI.
-- Source : apps/tools/src/migrations/sinoe/utils.ts (TYPOLOGIES_SINOE)
insert into typologie_sinoe (id, code_sinoe, libelle)
values ('dense', 'D', 'Urbain dense'),
       ('urbain', 'U', 'Urbain'),
       ('mixte_urbain', 'M1', 'Mixte à dominante urbaine'),
       ('mixte_rural', 'M2', 'Mixte à dominante rurale'),
       ('rural_ville_centre', 'R1', 'Rural avec ville centre'),
       ('rural_disperse', 'R2', 'Rural dispersé'),
       ('touristique', 'T1', 'Très touristique'),
       ('touristique_urbain', 'T2', 'Touristique urbain'),
       ('autre_touristique', 'T3', 'Autre touristique')
on conflict (id) do nothing;
