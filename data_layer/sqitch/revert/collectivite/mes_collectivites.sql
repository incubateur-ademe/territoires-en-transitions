-- Deploy tet:mes_collectivite to pg
-- requires: collectivites
-- requires: droits

BEGIN;

create or replace view mes_collectivites(collectivite_id, nom, niveau_acces, est_auditeur, access_restreint) as
WITH droits_collectivite AS (SELECT private_utilisateur_droit.collectivite_id,
                                    private_utilisateur_droit.niveau_acces
                             FROM private_utilisateur_droit
                             WHERE private_utilisateur_droit.user_id = auth.uid()
                               AND private_utilisateur_droit.active),
     droits_auditeur AS (SELECT DISTINCT la.collectivite_id
                         FROM audit_auditeur aa
                                  JOIN labellisation.audit la ON aa.audit_id = la.id
                         WHERE la.date_fin IS NULL
                           AND aa.auditeur = auth.uid()),
     droits AS (SELECT droits_collectivite.collectivite_id
                FROM droits_collectivite
                UNION
                SELECT droits_auditeur.collectivite_id
                FROM droits_auditeur)
SELECT d.collectivite_id,
       cn.nom,
       pud.niveau_acces,
       (SELECT count(*) > 0
        FROM droits_auditeur da
        WHERE da.collectivite_id = d.collectivite_id) AS est_auditeur,
       c.access_restreint
FROM droits d
         JOIN collectivite c ON d.collectivite_id = c.id
         JOIN named_collectivite cn USING (collectivite_id)
         LEFT JOIN droits_collectivite pud USING (collectivite_id);

COMMIT;
