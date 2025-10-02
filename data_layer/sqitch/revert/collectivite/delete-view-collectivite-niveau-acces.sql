-- Revert tet:collectivite/delete-view-collectivite-niveau-acces from pg

BEGIN;

create or replace view collectivite_niveau_acces
as
 WITH current_droits AS (
         SELECT private_utilisateur_droit.id,
            private_utilisateur_droit.user_id,
            private_utilisateur_droit.collectivite_id,
            private_utilisateur_droit.active,
            private_utilisateur_droit.created_at,
            private_utilisateur_droit.modified_at,
            private_utilisateur_droit.niveau_acces,
            private_utilisateur_droit.invitation_id
           FROM private_utilisateur_droit
          WHERE private_utilisateur_droit.user_id = auth.uid() AND private_utilisateur_droit.active
        )
 SELECT named_collectivite.collectivite_id,
    named_collectivite.nom,
    current_droits.niveau_acces,
    private.est_auditeur(named_collectivite.collectivite_id) AS est_auditeur,
    c.access_restreint
   FROM named_collectivite
     LEFT JOIN current_droits ON named_collectivite.collectivite_id = current_droits.collectivite_id
     LEFT JOIN collectivite c ON named_collectivite.collectivite_id = c.id
  ORDER BY (unaccent(named_collectivite.nom::text));

COMMIT;
