-- Deploy tet:retool/labellisation to pg

BEGIN;

drop view retool_labellisation_demande;
create view retool_labellisation_demande
as
select ld.id,
       ld.en_cours,
       ld.collectivite_id,
       ld.referentiel,
       ld.etoiles,
       ld.date,
       nc.nom,
       ld.sujet,
       ld.envoyee_le,
       ld.modified_at,
       dcp.prenom as demandeur_prenom,
       dcp.nom as demandeur_nom,
       dcp.email as demandeur_email,
       pcm.fonction as demandeur_fonction
from labellisation.demande ld
left join named_collectivite nc on ld.collectivite_id = nc.collectivite_id
left join dcp on dcp.user_id = ld.demandeur
left join private_collectivite_membre pcm on ld.collectivite_id = pcm.collectivite_id and dcp.user_id = pcm.user_id;


COMMIT;
