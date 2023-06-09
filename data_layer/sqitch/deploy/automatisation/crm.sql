-- Deploy tet:utils/automatisation to pg

BEGIN;

create view crm_labellisations
as
select l.id,
       nom || ' (' || collectivite_id || ')' as collectivite_key,
       l.referentiel,
       l.obtenue_le,
       l.annee,
       l.etoiles,
       l.score_realise,
       l.score_programme
from stats.collectivite
         join labellisation l using (collectivite_id)
where is_service_role()
order by nom, obtenue_le desc;


COMMIT;
