-- Revert tet:collectivite/drop_mes_collectivites from pg

BEGIN;

CREATE VIEW public.mes_collectivites (collectivite_id, nom, niveau_acces, est_auditeur, access_restreint) AS
WITH droits_collectivite AS (SELECT private_utilisateur_droit.collectivite_id,
                                    private_utilisateur_droit.niveau_acces
                             FROM public.private_utilisateur_droit
                             WHERE private_utilisateur_droit.user_id = auth.uid()
                               AND private_utilisateur_droit.active),
     droits_auditeur AS (SELECT DISTINCT la.collectivite_id
                         FROM public.audit_auditeur aa
                                  JOIN labellisation.audit la ON aa.audit_id = la.id
                         WHERE not la.clos
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
         JOIN public.collectivite c ON d.collectivite_id = c.id
         JOIN public.named_collectivite cn USING (collectivite_id)
         LEFT JOIN droits_collectivite pud USING (collectivite_id);

ALTER TABLE public.mes_collectivites OWNER TO postgres;

GRANT ALL ON TABLE public.mes_collectivites TO anon;
GRANT ALL ON TABLE public.mes_collectivites TO authenticated;
GRANT ALL ON TABLE public.mes_collectivites TO service_role;

COMMIT;
