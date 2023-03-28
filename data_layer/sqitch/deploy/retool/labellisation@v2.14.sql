-- Deploy tet:retool/labellisation to pg

BEGIN;

create view retool_labellisation
as
select l.*, nom as collectivite_nom
from labellisation l
         join named_collectivite nc on l.collectivite_id = nc.collectivite_id;

create view retool_labellisation_demande
as
select ld.id,
       ld.en_cours,
       ld.collectivite_id,
       ld.referentiel,
       ld.etoiles,
       ld.date,
       nc.nom
from labellisation.demande ld
         left join named_collectivite nc on ld.collectivite_id = nc.collectivite_id;


COMMIT;
