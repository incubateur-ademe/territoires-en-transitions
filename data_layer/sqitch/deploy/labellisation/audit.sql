-- Deploy tet:labellisation/audit to pg
BEGIN;

-- Drop the existing views
drop view if exists retool_preuves;
drop view if exists preuve;

-- Recreate the preuve view with updated action field access
create or replace view preuve
            (preuve_type, id, collectivite_id, fichier, lien, commentaire, created_at, created_by, created_by_nom,
             action, preuve_reglementaire, demande, rapport, audit)
as
SELECT 'complementaire'::preuve_type               AS preuve_type,
       pc.id,
       pc.collectivite_id,
       fs.snippet                                  AS fichier,
       pc.lien,
       pc.commentaire,
       pc.modified_at                              AS created_at,
       pc.modified_by                              AS created_by,
       utilisateur.modified_by_nom(pc.modified_by) AS created_by_nom,
       -- Replace action_snippet with action_id and referentiel
       jsonb_build_object(
           'action_id', ad.action_id,
           'identifiant', ad.identifiant,
           'referentiel', ad.referentiel
       )                                           as action,
       NULL::jsonb                                 AS preuve_reglementaire,
       NULL::jsonb                                 AS demande,
       NULL::jsonb                                 AS rapport,
       NULL::jsonb                                 AS audit
FROM preuve_complementaire pc
LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pc.fichier_id
left join action_definition ad
                   on ad.action_id = pc.action_id
WHERE can_read_acces_restreint(pc.collectivite_id)
  AND (
    fs.snippet is null
        or (fs.snippet ->> 'confidentiel'::text)::boolean is false
        or have_lecture_acces(pc.collectivite_id)
        or private.est_auditeur(pc.collectivite_id)
    )
UNION ALL
SELECT 'reglementaire'::preuve_type                AS preuve_type,
       pr.id,
       c.id                                        AS collectivite_id,
       fs.snippet                                  AS fichier,
       pr.lien,
       pr.commentaire,
       pr.modified_at                              AS created_at,
       pr.modified_by                              AS created_by,
       utilisateur.modified_by_nom(pr.modified_by) AS created_by_nom,
       -- Replace action_snippet with action_id and referentiel
       jsonb_build_object(
           'action_id', ad.action_id,
           'identifiant', ad.identifiant,
           'referentiel', ad.referentiel
       )                                           as action,
       to_jsonb(prd.*)                             AS preuve_reglementaire,
       NULL::jsonb                                 AS demande,
       NULL::jsonb                                 AS rapport,
       NULL::jsonb                                 AS audit
FROM collectivite c
LEFT JOIN preuve_reglementaire_definition prd ON true
LEFT JOIN preuve_reglementaire pr ON prd.id::text = pr.preuve_id::text AND c.id = pr.collectivite_id
LEFT JOIN preuve_action pa ON prd.id::text = pa.preuve_id::text
LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pr.fichier_id
left join action_definition ad
                   on ad.action_id = pa.action_id
WHERE can_read_acces_restreint(c.id)
  AND (
    fs.snippet is null
        or (fs.snippet ->> 'confidentiel'::text)::boolean is false
        or have_lecture_acces(c.id)
        or private.est_auditeur(c.id)
    )
UNION ALL
SELECT 'labellisation'::preuve_type               AS preuve_type,
       p.id,
       d.collectivite_id,
       fs.snippet                                 AS fichier,
       p.lien,
       p.commentaire,
       p.modified_at                              AS created_at,
       p.modified_by                              AS created_by,
       utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
       NULL::jsonb                                AS action,
       NULL::jsonb                                AS preuve_reglementaire,
       to_jsonb(d.*)                              AS demande,
       NULL::jsonb                                AS rapport,
       NULL::jsonb                                AS audit
FROM labellisation.demande d
JOIN preuve_labellisation p ON p.demande_id = d.id
LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
WHERE can_read_acces_restreint(d.collectivite_id)
  AND (
    fs.snippet is null
        or (fs.snippet ->> 'confidentiel'::text)::boolean is false
        or have_lecture_acces(d.collectivite_id)
        or private.est_auditeur(d.collectivite_id)
    )
UNION ALL
SELECT 'rapport'::preuve_type                     AS preuve_type,
       p.id,
       p.collectivite_id,
       fs.snippet                                 AS fichier,
       p.lien,
       p.commentaire,
       p.modified_at                              AS created_at,
       p.modified_by                              AS created_by,
       utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
       NULL::jsonb                                AS action,
       NULL::jsonb                                AS preuve_reglementaire,
       NULL::jsonb                                AS demande,
       to_jsonb(p.*)                              AS rapport,
       NULL::jsonb                                AS audit
FROM preuve_rapport p
LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
WHERE can_read_acces_restreint(p.collectivite_id)
  AND (
    fs.snippet is null
        or (fs.snippet ->> 'confidentiel'::text)::boolean is false
        or have_lecture_acces(p.collectivite_id)
        or private.est_auditeur(p.collectivite_id)
    )
UNION ALL
SELECT 'audit'::preuve_type                       AS preuve_type,
       p.id,
       a.collectivite_id,
       fs.snippet                                 AS fichier,
       p.lien,
       p.commentaire,
       p.modified_at                              AS created_at,
       p.modified_by                              AS created_by,
       utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
       NULL::jsonb                                AS action,
       NULL::jsonb                                AS preuve_reglementaire,
       CASE
           WHEN d.id IS NOT NULL THEN to_jsonb(d.*)
           ELSE NULL::jsonb
       END                                        AS demande,
       NULL::jsonb                                AS rapport,
       to_jsonb(a.*)                              AS audit
FROM audit a
JOIN preuve_audit p ON p.audit_id = a.id
LEFT JOIN labellisation.demande d ON a.demande_id = d.id
LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
WHERE can_read_acces_restreint(a.collectivite_id)
  AND (
    fs.snippet is null
        or (fs.snippet ->> 'confidentiel'::text)::boolean is false
        or have_lecture_acces(a.collectivite_id)
        or private.est_auditeur(a.collectivite_id)
    );

-- Recreate the retool_preuves view with updated action field access
create view retool_preuves
as
 SELECT preuve.collectivite_id,
    nc.nom,
    preuve.action ->> 'referentiel'::text AS referentiel,
    preuve.action ->> 'action_id'::text AS action,
    preuve.preuve_type,
    preuve.fichier ->> 'filename'::text AS fichier,
    preuve.lien ->> 'url'::text AS lien,
    preuve.created_at
   FROM preuve
     JOIN named_collectivite nc ON nc.collectivite_id = preuve.collectivite_id AND preuve.created_at IS NOT NULL
  WHERE ( SELECT is_service_role() AS is_service_role)
  ORDER BY preuve.collectivite_id, (preuve.action ->> 'referentiel'::text), (naturalsort(preuve.action ->> 'action_id'::text));
  ;
  
COMMIT;
