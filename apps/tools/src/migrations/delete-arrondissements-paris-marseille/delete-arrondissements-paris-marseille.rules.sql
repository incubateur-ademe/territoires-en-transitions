-- Liste fermée des traitements validés pour TET-6518. Les prédicats utilisent
-- l'alias t et $1 (identifiants des arrondissements). Aucun SQL fourni en entrée.
-- L'ordre retire les enfants avant leurs parents. Une référence hors de cette
-- liste reste bloquante, même avec ON DELETE CASCADE ou SET NULL.
CREATE OR REPLACE FUNCTION pg_temp.arrondissements_cleanup_rules()
RETURNS TABLE (step integer, relation regclass, predicate text, operation text)
LANGUAGE sql AS $$
    SELECT step, to_regclass(table_name), predicate, operation
    FROM (VALUES
        (10, 'historique.fiche_action_pilote',
            't.fiche_historise_id IN (SELECT id FROM historique.fiche_action WHERE collectivite_id = ANY($1))', 'archive'),
        (20, 'historique.fiche_action', 't.collectivite_id = ANY($1)', 'archive'),
        (30, 'public.fiche_action', 't.collectivite_id = ANY($1)', 'transfer'),
        (40, 'public.action_pilote', 't.collectivite_id = ANY($1)', 'archive'),
        (41, 'public.demarche_document_additional', 't.collectivite_id = ANY($1)', 'archive'),
        (42, 'public.demarche_pcaet_source_metadonnee', 't.collectivite_id = ANY($1)', 'archive'),
        (43, 'public.demarche_pcaet_vulnerabilite_valeur', 't.demarche_id IN (SELECT id FROM public.demarche WHERE collectivite_id = ANY($1))', 'archive'),
        (44, 'public.demarche_pilote', 't.demarche_id IN (SELECT id FROM public.demarche WHERE collectivite_id = ANY($1))', 'archive'),
        (45, 'public.demarche_plan_action', 't.demarche_id IN (SELECT id FROM public.demarche WHERE collectivite_id = ANY($1))', 'archive'),
        (46, 'public.fiche_action_axe',
            't.axe_id IN (SELECT id FROM public.axe WHERE collectivite_id = ANY($1))
             OR t.fiche_id IN (SELECT id FROM public.fiche_action WHERE collectivite_id = ANY($1))', 'archive'),
        (47, 'public.fiche_action_structure_tag',
            't.structure_tag_id IN (SELECT id FROM public.structure_tag WHERE collectivite_id = ANY($1))
             OR t.fiche_id IN (SELECT id FROM public.fiche_action WHERE collectivite_id = ANY($1))', 'archive'),
        (48, 'public.fiche_action_libre_tag',
            't.libre_tag_id IN (SELECT id FROM public.libre_tag WHERE collectivite_id = ANY($1))
             OR t.fiche_id IN (SELECT id FROM public.fiche_action WHERE collectivite_id = ANY($1))', 'archive'),
        (49, 'public.demarche', 't.collectivite_id = ANY($1)', 'archive'),
        (56, 'public.annexe', 't.collectivite_id = ANY($1)', 'archive'),
        (57, 'public.axe', 't.collectivite_id = ANY($1)', 'archive'),
        (50, 'public.action_impact_statut',
            't.panier_id IN (SELECT id FROM public.panier WHERE collectivite_id = ANY($1) OR collectivite_preset = ANY($1))', 'archive'),
        (60, 'public.action_impact_panier',
            't.panier_id IN (SELECT id FROM public.panier WHERE collectivite_id = ANY($1) OR collectivite_preset = ANY($1))', 'archive'),
        (70, 'public.panier', 't.collectivite_id = ANY($1) OR t.collectivite_preset = ANY($1)', 'archive'),
        (80, 'public.audit_auditeur',
            't.audit_id IN (SELECT id FROM labellisation.audit WHERE collectivite_id = ANY($1))', 'archive'),
        (90, 'labellisation.action_audit_state', 't.collectivite_id = ANY($1)', 'archive'),
        (100, 'public.pre_audit_scores', 't.collectivite_id = ANY($1)', 'archive'),
        (110, 'public.post_audit_scores', 't.collectivite_id = ANY($1)', 'archive'),
        (120, 'public.score_snapshot', 't.collectivite_id = ANY($1)', 'archive'),
        (130, 'labellisation.audit', 't.collectivite_id = ANY($1)', 'archive'),
        (135, 'raw.backup_labellisation_audit', 't.collectivite_id = ANY($1)', 'archive'),
        (140, 'labellisation.demande', 't.collectivite_id = ANY($1)', 'archive'),
        (145, 'raw.backup_labellisation_demande', 't.collectivite_id = ANY($1)', 'archive'),
        (150, 'public.private_collectivite_membre', 't.collectivite_id = ANY($1)', 'archive'),
        (151, 'private.collectivite_membre_backup', 't.collectivite_id = ANY($1)', 'archive'),
        (152, 'private.collectivite_membre_backup2', 't.collectivite_id = ANY($1)', 'archive'),
        (160, 'public.private_utilisateur_droit', 't.collectivite_id = ANY($1)', 'archive'),
        (165, 'labellisation.bibliotheque_fichier', 't.collectivite_id = ANY($1)', 'archive'),
        (170, 'public.service_tag', 't.collectivite_id = ANY($1)', 'archive'),
        (171, 'public.structure_tag', 't.collectivite_id = ANY($1)', 'archive'),
        (172, 'public.personne_tag', 't.collectivite_id = ANY($1)', 'archive'),
        (173, 'public.libre_tag', 't.collectivite_id = ANY($1)', 'archive'),
        (180, 'public.indicateur_valeur', 't.collectivite_id = ANY($1)', 'archive'),
        (185, 'archive.indicateur_valeur_backup', 't.collectivite_id = ANY($1)', 'archive'),
        (190, 'archive.indicateur_resultat', 't.collectivite_id = ANY($1)', 'archive'),
        (200, 'public.reponse_binaire', 't.collectivite_id = ANY($1)', 'archive'),
        (210, 'historique.reponse_binaire', 't.collectivite_id = ANY($1)', 'archive'),
        (220, 'public.personnalisation_consequence', 't.collectivite_id = ANY($1)', 'archive'),
        (230, 'public.client_scores', 't.collectivite_id = ANY($1)', 'archive'),
        (240, 'public.usage', 't.collectivite_id = ANY($1)', 'archive'),
        (250, 'public.visite', 't.collectivite_id = ANY($1)', 'archive'),
        (260, 'public.usage_backup', 't.collectivite_id = ANY($1)', 'archive'),
        (270, 'public.visite_backup', 't.collectivite_id = ANY($1)', 'archive'),
        (280, 'migration.plan_action', 't.collectivite_id = ANY($1)', 'archive'),
        (290, 'public.commune', 't.collectivite_id = ANY($1)', 'archive'),
        (300, 'public.collectivite_bucket', 't.collectivite_id = ANY($1)', 'archive'),
        (310, 'public.collectivite', 't.id = ANY($1)', 'archive')
    ) AS rules(step, table_name, predicate, operation)
    WHERE to_regclass(table_name) IS NOT NULL
    ORDER BY step;
$$;

-- FK vers collectivite.id et colonnes collectivite_id sans contrainte.
CREATE OR REPLACE FUNCTION pg_temp.arrondissements_references()
RETURNS TABLE (relation regclass, column_name name, column_type text)
LANGUAGE sql AS $$
    WITH columns AS (
        SELECT c.conrelid AS relation_id, key.attnum
        FROM pg_catalog.pg_constraint c
        CROSS JOIN LATERAL unnest(c.conkey, c.confkey) AS key(attnum, referenced_attnum)
        JOIN pg_catalog.pg_attribute a
            ON a.attrelid = c.confrelid AND a.attnum = key.referenced_attnum
        WHERE c.contype = 'f' AND c.confrelid = 'public.collectivite'::regclass AND a.attname = 'id'
        UNION
        SELECT attrelid, attnum FROM pg_catalog.pg_attribute
        WHERE attname = 'collectivite_id' AND NOT attisdropped
    )
    SELECT DISTINCT c.relation_id::regclass, a.attname,
        pg_catalog.format_type(a.atttypid, NULL)
    FROM columns c
    JOIN pg_catalog.pg_class r ON r.oid = c.relation_id
    JOIN pg_catalog.pg_namespace n ON n.oid = r.relnamespace
    JOIN pg_catalog.pg_attribute a ON a.attrelid = c.relation_id AND a.attnum = c.attnum
    WHERE r.relkind IN ('r', 'p') AND NOT r.relispartition
        AND n.nspname !~ '^pg_' AND n.nspname <> 'information_schema';
$$;

-- Contrôle aussi les enfants qui ne portent pas de collectivite_id. Le test
-- couvre toutes les colonnes d'une FK composite, et ne fait aucune cascade.
CREATE OR REPLACE FUNCTION pg_temp.arrondissements_check_children(
    target_ids integer[], apply boolean, deleting_relation regclass DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
    dependency record;
    reference_count bigint;
    blocked boolean := false;
BEGIN
    FOR dependency IN
        SELECT c.conrelid::regclass AS child, parent_rule.relation AS parent,
            parent_rule.predicate AS parent_predicate,
            CASE WHEN deleting_relation IS NULL AND (
                child_rule.step < parent_rule.step
                OR c.conrelid = c.confrelid
            )
                AND (child_rule.operation = 'archive' OR parent_rule.relation = 'public.collectivite'::regclass)
                THEN child_rule.predicate ELSE 'false' END AS child_predicate,
            string_agg(format('child.%I = t.%I', child_col.attname, parent_col.attname), ' AND ' ORDER BY key.ordinality) AS join_condition
        FROM pg_constraint c
        JOIN pg_temp.arrondissements_cleanup_rules() parent_rule
            ON c.confrelid = parent_rule.relation AND parent_rule.operation = 'archive'
        LEFT JOIN pg_temp.arrondissements_cleanup_rules() child_rule ON c.conrelid = child_rule.relation
        CROSS JOIN LATERAL unnest(c.conkey, c.confkey) WITH ORDINALITY AS key(child_attnum, parent_attnum, ordinality)
        JOIN pg_attribute child_col ON child_col.attrelid = c.conrelid AND child_col.attnum = key.child_attnum
        JOIN pg_attribute parent_col ON parent_col.attrelid = c.confrelid AND parent_col.attnum = key.parent_attnum
        WHERE c.contype = 'f' AND c.conparentid = 0
            AND (deleting_relation IS NULL OR parent_rule.relation = deleting_relation)
        GROUP BY c.oid, c.conrelid, parent_rule.relation, parent_rule.predicate, parent_rule.step,
            child_rule.predicate, child_rule.operation, child_rule.step
        ORDER BY c.conrelid, c.oid
    LOOP
        IF apply THEN
            EXECUTE format('LOCK TABLE %s IN SHARE ROW EXCLUSIVE MODE', dependency.child);
        END IF;
        EXECUTE format(
            'SELECT count(*) FROM %s child JOIN %s t ON %s WHERE (%s)
             AND NOT coalesce((SELECT (%s) FROM (SELECT child.*) t), false)',
            dependency.child, dependency.parent, dependency.join_condition,
            dependency.parent_predicate, dependency.child_predicate
        ) INTO reference_count USING target_ids;
        IF reference_count > 0 THEN
            RAISE NOTICE 'BLOCAGE : % référence(s) de % vers %, hors du traitement prévu',
                reference_count, dependency.child, dependency.parent;
            blocked := true;
        END IF;
    END LOOP;
    RETURN blocked;
END;
$$;
