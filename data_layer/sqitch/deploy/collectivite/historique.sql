-- Deploy tet:collectivite/historique to pg

BEGIN;

create view historique_utilisateur
as
select collectivite_id, modified_by_id, modified_by_nom
from historique
group by collectivite_id, modified_by_id, modified_by_nom;

COMMIT;
