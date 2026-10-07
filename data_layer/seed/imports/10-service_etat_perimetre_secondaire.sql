-- Périmètres géographiques secondaires des services de l'État.
--
-- Une direction régionale peut en piloter plusieurs — l'ADEME Océan Indien
-- couvre La Réunion et Mayotte. `collectivite` ne porte qu'un code de région et
-- un code de département, le périmètre principal ; les autres viennent ici.
--
-- Source : data_layer/seed/sources/service-etat/*.csv. Fichier généré —
-- régénérer avec `make seeds_rebuild_from_source`
-- (script : data_layer/scripts/generate_service_etat.py).
--
-- Deux lecteurs, comme son voisin `09-service_etat.sql` : `seed.sh` le charge sur
-- une base neuve, et le change sqitch `collectivite/perimetre_secondaire`
-- l'inclut par `\ir` pour les bases déjà peuplées. D'où l'absence de
-- `begin`/`commit` : c'est le change qui ouvre la transaction.
--
-- Il est séparé de `09-service_etat.sql` parce que la table qu'il peuple est
-- arrivée après lui : le change qui inclut le premier fichier est déjà déployé,
-- ne sera pas rejoué, et sur une base neuve il jouerait ces lignes avant que la
-- table existe.

insert into collectivite_perimetre_secondaire (collectivite_id, region_code, source)
select principale.id, v.region_code, 'import_service_etat'
from (values
        ('dr_ademe', '385290309', '00397', '06')
) as v (type, siren, nic, region_code)
join collectivite as principale
  on principale.type = v.type
 and principale.siren = v.siren
 and principale.nic = v.nic
on conflict (collectivite_id, region_code) where region_code is not null
do nothing;
