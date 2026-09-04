-- Deploy tet:collectivite/service_etat_import to pg
-- requires: collectivite/type_add_dr_ademe_service_national
-- requires: collectivite/nic

-- Peuple les services de l'État instructeurs du dépôt PCAET : DREAL, DDT,
-- DR ADEME et services nationaux, plus le SIREN et le NIC des conseils
-- régionaux.
--
-- Ce script n'est qu'une enveloppe : les données vivent dans
-- `data_layer/seed/imports/09-service_etat.sql`, généré depuis
-- `data_layer/seed/sources/service-etat/*.csv` par
-- `data_layer/scripts/generate_service_etat.py`. Un seul exemplaire, donc, là où
-- deux fichiers générés avaient divergé en une journée — et une empreinte de
-- script stable, que `make seeds_rebuild_from_source` ne touche plus.
--
-- Le corps inclus est idempotent et ne s'applique qu'à une base déjà peuplée
-- (`where exists (select 1 from collectivite)` sur chaque bloc) : une base neuve
-- est vide au moment des migrations, et y consommer la séquence d'`id` avant le
-- seed décalerait la collectivité 1, dont des seeds et des fixtures dépendent en
-- clair. Sur une base neuve, c'est donc `seed.sh` qui peuple, à sa place dans
-- l'ordre de chargement.
--
-- Une correction de la liste **après** déploiement en production demande un
-- nouveau change : celui-ci ne sera pas rejoué. Régénérer le seed reste sans
-- risque tant que le change n'est pas déployé, et le fichier inclus n'entre pas
-- dans l'empreinte enregistrée par sqitch — c'est un choix assumé, pas un oubli.
--
-- `\ir` résout relativement à ce fichier, pas au répertoire de travail.

BEGIN;

\ir ../../../seed/imports/09-service_etat.sql

COMMIT;
