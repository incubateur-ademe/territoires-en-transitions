-- Revert tet:labellisation/drop_bibliotheque_fichier_views from pg

BEGIN;

CREATE VIEW public.bibliotheque_fichier AS
 SELECT bf.id,
    bf.collectivite_id,
    bf.hash,
    bf.filename,
    o.bucket_id,
    o.id AS file_id,
    ((o.metadata ->> 'size'::text))::integer AS filesize,
    bf.confidentiel
   FROM ((labellisation.bibliotheque_fichier bf
     JOIN public.collectivite_bucket cb ON ((cb.collectivite_id = bf.collectivite_id)))
     JOIN storage.objects o ON (((o.name = (bf.hash)::text) AND (o.bucket_id = cb.bucket_id))))
  WHERE (public.can_read_acces_restreint(bf.collectivite_id) AND ((bf.confidentiel IS FALSE) OR public.have_lecture_acces(bf.collectivite_id) OR private.est_auditeur(bf.collectivite_id)));
ALTER TABLE public.bibliotheque_fichier OWNER TO postgres;

CREATE VIEW labellisation.bibliotheque_fichier_snippet AS
 SELECT bibliotheque_fichier.id,
    jsonb_build_object('filename', bibliotheque_fichier.filename, 'hash', bibliotheque_fichier.hash, 'bucket_id', bibliotheque_fichier.bucket_id, 'filesize', bibliotheque_fichier.filesize, 'confidentiel', bibliotheque_fichier.confidentiel) AS snippet
   FROM public.bibliotheque_fichier;
ALTER TABLE labellisation.bibliotheque_fichier_snippet OWNER TO postgres;

CREATE VIEW public.bibliotheque_annexe AS
 WITH plan AS (
         SELECT faa.fiche_id,
            array_agg(DISTINCT axe.plan) AS ids
           FROM (public.fiche_action_axe faa
             JOIN public.axe ON ((faa.axe_id = axe.id)))
          GROUP BY faa.fiche_id
        )
 SELECT a.id,
    a.collectivite_id,
    plan.ids AS plan_ids,
    a.fiche_id,
    fs.snippet AS fichier,
    a.lien,
    a.commentaire,
    a.modified_at AS created_at,
    a.modified_by AS created_by,
    utilisateur.modified_by_nom(a.modified_by) AS created_by_nom
   FROM ((public.annexe a
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON ((fs.id = a.fichier_id)))
     LEFT JOIN plan USING (fiche_id))
  WHERE (public.can_read_acces_restreint(a.collectivite_id) AND ((fs.snippet IS NULL) OR (((fs.snippet ->> 'confidentiel'::text))::boolean IS FALSE) OR public.have_lecture_acces(a.collectivite_id) OR private.est_auditeur(a.collectivite_id)));
ALTER TABLE public.bibliotheque_annexe OWNER TO postgres;

CREATE VIEW public.preuve AS
 SELECT 'complementaire'::public.preuve_type AS preuve_type,
    pc.id,
    pc.collectivite_id,
    fs.snippet AS fichier,
    pc.lien,
    pc.commentaire,
    pc.modified_at AS created_at,
    pc.modified_by AS created_by,
    utilisateur.modified_by_nom(pc.modified_by) AS created_by_nom,
    jsonb_build_object('action_id', ad.action_id, 'identifiant', ad.identifiant, 'referentiel', ad.referentiel) AS action,
    NULL::jsonb AS preuve_reglementaire,
    NULL::jsonb AS demande,
    NULL::jsonb AS rapport,
    NULL::jsonb AS audit
   FROM ((public.preuve_complementaire pc
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON ((fs.id = pc.fichier_id)))
     LEFT JOIN public.action_definition ad ON (((ad.action_id)::text = (pc.action_id)::text)))
  WHERE (public.can_read_acces_restreint(pc.collectivite_id) AND ((fs.snippet IS NULL) OR (((fs.snippet ->> 'confidentiel'::text))::boolean IS FALSE) OR public.have_lecture_acces(pc.collectivite_id) OR private.est_auditeur(pc.collectivite_id)))
UNION ALL
 SELECT 'reglementaire'::public.preuve_type AS preuve_type,
    pr.id,
    c.id AS collectivite_id,
    fs.snippet AS fichier,
    pr.lien,
    pr.commentaire,
    pr.modified_at AS created_at,
    pr.modified_by AS created_by,
    utilisateur.modified_by_nom(pr.modified_by) AS created_by_nom,
    jsonb_build_object('action_id', ad.action_id, 'identifiant', ad.identifiant, 'referentiel', ad.referentiel) AS action,
    to_jsonb(prd.*) AS preuve_reglementaire,
    NULL::jsonb AS demande,
    NULL::jsonb AS rapport,
    NULL::jsonb AS audit
   FROM (((((public.collectivite c
     LEFT JOIN public.preuve_reglementaire_definition prd ON (true))
     LEFT JOIN public.preuve_reglementaire pr ON ((((prd.id)::text = (pr.preuve_id)::text) AND (c.id = pr.collectivite_id))))
     LEFT JOIN public.preuve_action pa ON (((prd.id)::text = (pa.preuve_id)::text)))
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON ((fs.id = pr.fichier_id)))
     LEFT JOIN public.action_definition ad ON (((ad.action_id)::text = (pa.action_id)::text)))
  WHERE (public.can_read_acces_restreint(c.id) AND ((fs.snippet IS NULL) OR (((fs.snippet ->> 'confidentiel'::text))::boolean IS FALSE) OR public.have_lecture_acces(c.id) OR private.est_auditeur(c.id)))
UNION ALL
 SELECT 'labellisation'::public.preuve_type AS preuve_type,
    p.id,
    d.collectivite_id,
    fs.snippet AS fichier,
    p.lien,
    p.commentaire,
    p.modified_at AS created_at,
    p.modified_by AS created_by,
    utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
    NULL::jsonb AS action,
    NULL::jsonb AS preuve_reglementaire,
    to_jsonb(d.*) AS demande,
    NULL::jsonb AS rapport,
    NULL::jsonb AS audit
   FROM ((labellisation.demande d
     JOIN public.preuve_labellisation p ON ((p.demande_id = d.id)))
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON ((fs.id = p.fichier_id)))
  WHERE (public.can_read_acces_restreint(d.collectivite_id) AND ((fs.snippet IS NULL) OR (((fs.snippet ->> 'confidentiel'::text))::boolean IS FALSE) OR public.have_lecture_acces(d.collectivite_id) OR private.est_auditeur(d.collectivite_id)))
UNION ALL
 SELECT 'rapport'::public.preuve_type AS preuve_type,
    p.id,
    p.collectivite_id,
    fs.snippet AS fichier,
    p.lien,
    p.commentaire,
    p.modified_at AS created_at,
    p.modified_by AS created_by,
    utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
    NULL::jsonb AS action,
    NULL::jsonb AS preuve_reglementaire,
    NULL::jsonb AS demande,
    to_jsonb(p.*) AS rapport,
    NULL::jsonb AS audit
   FROM (public.preuve_rapport p
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON ((fs.id = p.fichier_id)))
  WHERE (public.can_read_acces_restreint(p.collectivite_id) AND ((fs.snippet IS NULL) OR (((fs.snippet ->> 'confidentiel'::text))::boolean IS FALSE) OR public.have_lecture_acces(p.collectivite_id) OR private.est_auditeur(p.collectivite_id)))
UNION ALL
 SELECT 'audit'::public.preuve_type AS preuve_type,
    p.id,
    a.collectivite_id,
    fs.snippet AS fichier,
    p.lien,
    p.commentaire,
    p.modified_at AS created_at,
    p.modified_by AS created_by,
    utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
    NULL::jsonb AS action,
    NULL::jsonb AS preuve_reglementaire,
        CASE
            WHEN (d.id IS NOT NULL) THEN to_jsonb(d.*)
            ELSE NULL::jsonb
        END AS demande,
    NULL::jsonb AS rapport,
    to_jsonb(a.*) AS audit
   FROM (((public.audit a
     JOIN public.preuve_audit p ON ((p.audit_id = a.id)))
     LEFT JOIN labellisation.demande d ON ((a.demande_id = d.id)))
     LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON ((fs.id = p.fichier_id)))
  WHERE (public.can_read_acces_restreint(a.collectivite_id) AND ((fs.snippet IS NULL) OR (((fs.snippet ->> 'confidentiel'::text))::boolean IS FALSE) OR public.have_lecture_acces(a.collectivite_id) OR private.est_auditeur(a.collectivite_id)));
ALTER TABLE public.preuve OWNER TO postgres;

CREATE VIEW public.retool_preuves AS
 SELECT preuve.collectivite_id,
    nc.nom,
    (preuve.action ->> 'referentiel'::text) AS referentiel,
    (preuve.action ->> 'action_id'::text) AS action,
    preuve.preuve_type,
    (preuve.fichier ->> 'filename'::text) AS fichier,
    (preuve.lien ->> 'url'::text) AS lien,
    preuve.created_at
   FROM (public.preuve
     JOIN public.named_collectivite nc ON (((nc.collectivite_id = preuve.collectivite_id) AND (preuve.created_at IS NOT NULL))))
  WHERE ( SELECT public.is_service_role() AS is_service_role)
  ORDER BY preuve.collectivite_id, (preuve.action ->> 'referentiel'::text), (public.naturalsort((preuve.action ->> 'action_id'::text)));
ALTER TABLE public.retool_preuves OWNER TO postgres;

GRANT ALL ON TABLE public.bibliotheque_fichier TO anon;
GRANT ALL ON TABLE public.bibliotheque_fichier TO authenticated;
GRANT ALL ON TABLE public.bibliotheque_fichier TO service_role;
GRANT ALL ON TABLE labellisation.bibliotheque_fichier_snippet TO anon;
GRANT ALL ON TABLE labellisation.bibliotheque_fichier_snippet TO authenticated;
GRANT ALL ON TABLE labellisation.bibliotheque_fichier_snippet TO service_role;
GRANT ALL ON TABLE public.bibliotheque_annexe TO anon;
GRANT ALL ON TABLE public.bibliotheque_annexe TO authenticated;
GRANT ALL ON TABLE public.bibliotheque_annexe TO service_role;
GRANT ALL ON TABLE public.preuve TO anon;
GRANT ALL ON TABLE public.preuve TO authenticated;
GRANT ALL ON TABLE public.preuve TO service_role;
GRANT ALL ON TABLE public.retool_preuves TO anon;
GRANT ALL ON TABLE public.retool_preuves TO authenticated;
GRANT ALL ON TABLE public.retool_preuves TO service_role;

COMMIT;
