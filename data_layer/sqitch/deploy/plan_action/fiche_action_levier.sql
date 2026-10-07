-- Deploy tet:plan_action/fiche_action_levier to pg

BEGIN;

create type levier_id as enum (
  'chaudieres_fioul_renovation_residentiel',
  'chaudieres_gaz_renovation_residentiel',
  'sobriete_batiments_residentiel',
  'chaudiere_fioul_tertiaire',
  'chaudiere_gaz_tertiaire',
  'sobriete_isolation_batiments_tertiaire',
  'reduction_deplacements',
  'covoiturage',
  'velo_transport_commun',
  'vehicules_electriques',
  'efficacite_carburants_decarbones_vehicules_prives',
  'bus_cars_decarbones',
  'fret_decarbone_multimodalite',
  'efficacite_sobriete_logistique',
  'batiments_machines_agricoles',
  'elevage_durable',
  'pratiques_fertilisation_azotee',
  'gestion_forets_produits_bois',
  'pratiques_stockantes',
  'gestion_haies',
  'gestion_prairies',
  'sobriete_fonciere',
  'production_industrielle',
  'captage_methane_isdnd',
  'prevention_dechets',
  'valorisation_matiere_dechets',
  'electricite_renouvelable',
  'biogaz',
  'reseaux_chaleur_decarbones'
);

comment on type levier_id is
  'Identifiants techniques des leviers de decarbonation. La liste fait foi dans levierIdEnumValues (@tet/domain/shared) : ce type en est le reflet, verifie par un test.';

create type levier_categorie as enum (
  'amenagement',
  'planification',
  'financement',
  'gouvernance',
  'exemplarite',
  'sensibilisation'
);

comment on type levier_categorie is
  'Categories de type d''action rattachables a un levier. La liste fait foi dans categorieActionEnumValues (@tet/domain/shared). A ne pas confondre avec action_categorie, qui porte la taxonomie du referentiel.';

create table fiche_action_levier
(
  fiche_id   integer references fiche_action on delete cascade  not null,
  levier_id  levier_id                                          not null,
  categorie  levier_categorie                                   not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP not null,
  created_by uuid                     default auth.uid() references auth.users  not null,
  primary key (fiche_id, levier_id, categorie)
);

comment on table fiche_action_levier is
  'Rattachement durable d''une fiche action a un couple levier de decarbonation x categorie de type d''action';

-- RLS sans policy : seul service_role accede a la table, alimentee par le job de classification.
alter table fiche_action_levier
  enable row level security;

COMMIT;
