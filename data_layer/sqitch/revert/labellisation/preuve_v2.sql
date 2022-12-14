-- Deploy tet:labellisation/preuve_v2 to pg

BEGIN;

drop view preuve;
drop table preuve_audit;


-- La vue utilisée par le client qui regroupe tout les types de preuves.
create view preuve
as
-- Les preuves complémentaires.
select -- champs communs
       'complementaire':: preuve_type              as preuve_type,
       pc.id,
       pc.collectivite_id,
       fs.snippet                                  as fichier,
       pc.lien,
       pc.commentaire,
       pc.modified_at                              as created_at,
       pc.modified_by                              as created_by,
       utilisateur.modified_by_nom(pc.modified_by) as created_by_nom,
       snippet.snippet                             as action,
       null:: jsonb                                as preuve_reglementaire,
       null:: jsonb                                as demande,
       null:: jsonb                                as rapport
from preuve_complementaire pc
         left join labellisation.bibliotheque_fichier_snippet fs
                   on fs.id = pc.fichier_id
         left join labellisation.action_snippet snippet
                   on snippet.action_id = pc.action_id
                       and snippet.collectivite_id = pc.collectivite_id
union all

-- Toutes les preuves réglementaires par collectivité, avec ou sans fichier.
select 'reglementaire',
       pr.id,
       c.id,
       fs.snippet,
       pr.lien,
       pr.commentaire,
       pr.modified_at,
       pr.modified_by,
       utilisateur.modified_by_nom(pr.modified_by),
       snippet.snippet,
       (select jsonb_build_object(
                       'id', prd.id,
                       'nom', prd.nom,
                       'description', prd.description)),
       null,
       null
from collectivite c -- toutes les collectivités ...
         left join preuve_reglementaire_definition prd on true -- ... x toutes les preuves réglementaires
         left join preuve_reglementaire pr on prd.id = pr.preuve_id and c.id = pr.collectivite_id
         left join preuve_action pa on prd.id = pa.preuve_id
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = pr.fichier_id
         left join labellisation.action_snippet snippet
                   on snippet.action_id = pa.action_id and snippet.collectivite_id = c.id
union all

select 'labellisation',
       p.id,
       d.collectivite_id,
       fs.snippet,
       p.lien,
       p.commentaire,
       p.modified_at,
       p.modified_by,
       utilisateur.modified_by_nom(p.modified_by),
       null,
       null,
       (select jsonb_build_object(
                       'en_cours', d.en_cours,
                       'referentiel', d.referentiel,
                       'etoiles', d.etoiles,
                       'date', d.date,
                       'id', d.id
                   )),
       null
from labellisation.demande d
         join preuve_labellisation p on p.demande_id = d.id
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = p.fichier_id

union all
select 'rapport',
       p.id,
       p.collectivite_id,
       fs.snippet,
       p.lien,
       p.commentaire,
       p.modified_at,
       p.modified_by,
       utilisateur.modified_by_nom(p.modified_by),
       null,
       null,
       null,
       jsonb_build_object('date', p.date)
from preuve_rapport p
         left join labellisation.bibliotheque_fichier_snippet fs on fs.id = p.fichier_id
;

COMMIT;
