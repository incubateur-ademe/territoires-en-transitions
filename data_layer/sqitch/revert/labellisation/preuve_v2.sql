-- Deploy tet:labellisation/preuve_v2 to pg

BEGIN;

drop function update_bibliotheque_fichier_confidentiel;
drop function add_bibliotheque_fichier;
drop view retool_preuves;
drop view bibliotheque_annexe;
drop view preuve;
drop view labellisation.bibliotheque_fichier_snippet;
drop view bibliotheque_fichier;
alter table labellisation.bibliotheque_fichier drop column confidentiel;

create view bibliotheque_fichier(id, collectivite_id, hash, filename, bucket_id, file_id, filesize) as
SELECT bf.id,
       bf.collectivite_id,
       bf.hash,
       bf.filename,
       o.bucket_id,
       o.id                                   AS file_id,
       (o.metadata ->> 'size'::text)::integer AS filesize
FROM labellisation.bibliotheque_fichier bf
JOIN collectivite_bucket cb ON cb.collectivite_id = bf.collectivite_id
JOIN storage.objects o ON o.name = bf.hash::text AND o.bucket_id = cb.bucket_id
WHERE can_read_acces_restreint(bf.collectivite_id);
comment on view bibliotheque_fichier is 'Vue partielle de la table `public. bibliotheque_fichier` en json.';

create view labellisation.bibliotheque_fichier_snippet(id, snippet) as
SELECT bibliotheque_fichier.id,
       jsonb_build_object('filename', bibliotheque_fichier.filename, 'hash', bibliotheque_fichier.hash, 'bucket_id',
                          bibliotheque_fichier.bucket_id, 'filesize', bibliotheque_fichier.filesize) AS snippet
FROM bibliotheque_fichier;

create view preuve
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
       snippet.snippet                             AS action,
       NULL::jsonb                                 AS preuve_reglementaire,
       NULL::jsonb                                 AS demande,
       NULL::jsonb                                 AS rapport,
       NULL::jsonb                                 AS audit
FROM preuve_complementaire pc
LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pc.fichier_id
LEFT JOIN labellisation.action_snippet snippet
          ON snippet.action_id::text = pc.action_id::text AND snippet.collectivite_id = pc.collectivite_id
WHERE can_read_acces_restreint(pc.collectivite_id)
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
       snippet.snippet                             AS action,
       to_jsonb(prd.*)                             AS preuve_reglementaire,
       NULL::jsonb                                 AS demande,
       NULL::jsonb                                 AS rapport,
       NULL::jsonb                                 AS audit
FROM collectivite c
LEFT JOIN preuve_reglementaire_definition prd ON true
LEFT JOIN preuve_reglementaire pr ON prd.id::text = pr.preuve_id::text AND c.id = pr.collectivite_id
LEFT JOIN preuve_action pa ON prd.id::text = pa.preuve_id::text
LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pr.fichier_id
LEFT JOIN labellisation.action_snippet snippet
          ON snippet.action_id::text = pa.action_id::text AND snippet.collectivite_id = c.id
WHERE can_read_acces_restreint(c.id)
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
WHERE can_read_acces_restreint(a.collectivite_id);

create view bibliotheque_annexe
            (id, collectivite_id, plan_ids, fiche_id, fichier, lien, commentaire, created_at, created_by,
             created_by_nom) as
WITH plan AS (
             SELECT faa.fiche_id,
                    array_agg(d.plan_id) AS ids
             FROM fiche_action_axe faa
             JOIN plan_action_chemin d ON faa.axe_id = d.axe_id
             GROUP BY faa.fiche_id
             )
SELECT a.id,
       a.collectivite_id,
       plan.ids                                   AS plan_ids,
       a.fiche_id,
       fs.snippet                                 AS fichier,
       a.lien,
       a.commentaire,
       a.modified_at                              AS created_at,
       a.modified_by                              AS created_by,
       utilisateur.modified_by_nom(a.modified_by) AS created_by_nom
FROM annexe a
LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = a.fichier_id
LEFT JOIN plan USING (fiche_id)
WHERE can_read_acces_restreint(a.collectivite_id);

comment on view bibliotheque_annexe is 'Les fichiers ou les liens pour les annexes des fiches action dans un format similaire à la vue `preuve`';

create view retool_preuves (collectivite_id, nom, referentiel, action, preuve_type, fichier, lien, created_at) as
SELECT preuve.collectivite_id,
       nc.nom,
       preuve.action ->> 'referentiel'::text AS referentiel,
       preuve.action ->> 'identifiant'::text AS action,
       preuve.preuve_type,
       preuve.fichier ->> 'filename'::text   AS fichier,
       preuve.lien ->> 'url'::text           AS lien,
       preuve.created_at
FROM preuve
JOIN named_collectivite nc ON nc.collectivite_id = preuve.collectivite_id AND preuve.created_at IS NOT NULL
WHERE (
      SELECT is_service_role() AS is_service_role
      )
ORDER BY preuve.collectivite_id, (preuve.action ->> 'referentiel'::text),
         (naturalsort(preuve.action ->> 'identifiant'::text));

create function add_bibliotheque_fichier(collectivite_id integer, hash character varying, filename text) returns bibliotheque_fichier
    security definer
    language plpgsql
as
$$
declare
    inserted     integer;
    return_value bibliotheque_fichier;
begin
    if have_edition_acces(add_bibliotheque_fichier.collectivite_id) or
       private.est_auditeur(add_bibliotheque_fichier.collectivite_id)
    then
        if (select count(o.id) > 0
            from storage.objects o
            join collectivite_bucket cb on o.bucket_id = cb.bucket_id
            where cb.collectivite_id = add_bibliotheque_fichier.collectivite_id
              and o.name = add_bibliotheque_fichier.hash) is not null
        then
            insert into labellisation.bibliotheque_fichier(collectivite_id, hash, filename)
            values (add_bibliotheque_fichier.collectivite_id,
                    add_bibliotheque_fichier.hash,
                    add_bibliotheque_fichier.filename)
            returning id into inserted;

            select *
            from bibliotheque_fichier bf
            where bf.id = inserted
            into return_value;

            perform set_config('response.status', '201', true);
            return return_value;
        else
            perform set_config('response.status', '404', true);
            return null;
        end if;
    else
        perform set_config('response.status', '403', true);
        return null;
    end if;
end;
$$;

comment on function add_bibliotheque_fichier(integer, varchar, text) is 'Modifie un le nom d''un fichier présent dans le bucket de la collectivité à l''adresse `bucket/hash`, dans la bibliothèque de fichiers.';


COMMIT;
