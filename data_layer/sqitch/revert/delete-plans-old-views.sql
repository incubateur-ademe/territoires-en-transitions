-- Revert tet:delete-plans-old-views from pg

BEGIN;

-- Restore in reverse order of drops (dependencies first)

-- 1. upsert_axe (from plan_action/import@v2.64.0)
CREATE OR REPLACE FUNCTION public.upsert_axe(nom text, collectivite_id integer, parent integer) RETURNS integer
    LANGUAGE plpgsql
AS
$$
DECLARE
    existing_axe_id integer;
    axe_id          integer;
BEGIN
    IF have_edition_acces(collectivite_id) OR is_service_role() THEN
        SELECT a.id
        FROM axe a
        WHERE a.nom = trim(upsert_axe.nom)
          AND a.collectivite_id = upsert_axe.collectivite_id
          AND ((a.parent IS NULL AND upsert_axe.parent IS NULL)
            OR (a.parent = upsert_axe.parent))
        LIMIT 1
        INTO existing_axe_id;
        IF existing_axe_id IS NULL THEN
            INSERT INTO axe (nom, collectivite_id, parent)
            VALUES (trim(upsert_axe.nom), upsert_axe.collectivite_id, parent)
            RETURNING id INTO axe_id;
        ELSE
            axe_id = existing_axe_id;
        END IF;
        RETURN axe_id;
    ELSE
        PERFORM set_config('response.status', '403', true);
        RAISE 'L''utilisateur n''a pas de droit en edition sur la collectivité.';
    END IF;
END;
$$;

-- 2. private.fiche_resume (from plan_action/fiches@v2.102.0)
CREATE OR REPLACE VIEW private.fiche_resume AS
SELECT p.plans,
       fa.titre,
       fa.id,
       fa.statut,
       fa.collectivite_id,
       (SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
        FROM (SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                     pt.collectivite_id,
                     fap.tag_id,
                     fap.user_id
              FROM fiche_action_pilote fap
                       LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
                       LEFT JOIN dcp ON dcp.user_id = fap.user_id
              WHERE fap.fiche_id = fa.id) pil) AS pilotes,
       fa.modified_at,
       fa.date_fin_provisoire,
       fa.niveau_priorite,
       fa.restreint,
       fa.amelioration_continue
FROM fiche_action fa
         LEFT JOIN (SELECT faa.fiche_id,
                          array_agg(DISTINCT plan.*) AS plans
                   FROM fiche_action_axe faa
                            JOIN axe ON faa.axe_id = axe.id
                            JOIN axe plan ON axe.plan = plan.id
                   GROUP BY faa.fiche_id) p ON p.fiche_id = fa.id
GROUP BY fa.titre, fa.id, fa.statut, fa.collectivite_id, p.plans
ORDER BY (naturalsort(fa.titre::text));

-- 3. public.fiche_resume
CREATE OR REPLACE VIEW public.fiche_resume AS
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint,
       fr.amelioration_continue
FROM private.fiche_resume fr
WHERE can_read_acces_restreint(fr.collectivite_id);

-- 4. fiche_resume(fiche_action_indicateur) and fiche_resume(fiche_action_action)
CREATE OR REPLACE FUNCTION public.fiche_resume(fiche_action_action fiche_action_action) RETURNS SETOF fiche_resume
    STABLE
    SECURITY DEFINER
    ROWS 1
    LANGUAGE sql
BEGIN ATOMIC
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint,
       fr.amelioration_continue
FROM private.fiche_resume fr
WHERE ((fr.id = (fiche_resume.fiche_action_action).fiche_id) AND can_read_acces_restreint(fr.collectivite_id));
END;

CREATE OR REPLACE FUNCTION public.fiche_resume(fiche_action_indicateur fiche_action_indicateur) RETURNS SETOF fiche_resume
    STABLE
    SECURITY DEFINER
    ROWS 1
    LANGUAGE sql
BEGIN ATOMIC
SELECT fr.plans,
       fr.titre,
       fr.id,
       fr.statut,
       fr.collectivite_id,
       fr.pilotes,
       fr.modified_at,
       fr.date_fin_provisoire,
       fr.niveau_priorite,
       fr.restreint,
       fr.amelioration_continue
FROM private.fiche_resume fr
WHERE ((fr.id = (fiche_resume.fiche_action_indicateur).fiche_id) AND can_read_acces_restreint(fr.collectivite_id));
END;

-- 5. private.fiches_action (from notes_complementaires_column_deletion)
CREATE VIEW private.fiches_action AS
SELECT fa.modified_at,
       fa.id,
       fa.titre,
       fa.description,
       fa.piliers_eci,
       fa.objectifs,
       eff.resultats_attendus,
       fa.cibles,
       fa.ressources,
       fa.financements,
       fa.budget_previsionnel,
       fa.statut,
       fa.niveau_priorite,
       fa.date_debut,
       fa.date_fin_provisoire,
       fa.amelioration_continue,
       fa.calendrier,
       fa.instance_gouvernance,
       fa.participation_citoyenne,
       fa.participation_citoyenne_type,
       CASE
           WHEN tmo.niveau IS NULL THEN NULL::jsonb
           ELSE jsonb_build_object('id', tmo.niveau, 'nom', tmo.nom)
       END AS temps_de_mise_en_oeuvre,
       CASE
           WHEN fa.created_by IS NULL THEN NULL::jsonb
           ELSE jsonb_build_object('user_id', created_user.user_id, 'nom', created_user.nom, 'prenom', created_user.prenom, 'email', created_user.email)
       END AS created_by,
       fa.maj_termine,
       fa.collectivite_id,
       fa.created_at,
       CASE
           WHEN fa.modified_by IS NULL THEN NULL::jsonb
           ELSE jsonb_build_object('user_id', modified_user.user_id, 'nom', modified_user.nom, 'prenom', modified_user.prenom, 'email', modified_user.email)
       END AS modified_by,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (
       SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
       FROM (
            SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                   pt.collectivite_id,
                   fap.tag_id,
                   fap.user_id
            FROM fiche_action_pilote fap
            LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
            LEFT JOIN dcp ON dcp.user_id = fap.user_id
            WHERE fap.fiche_id = fa.id
            ) pil
       ) AS pilotes,
       (
       SELECT array_agg(ROW (ref.nom, ref.collectivite_id, ref.tag_id, ref.user_id)::personne) AS array_agg
       FROM (
            SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                   pt.collectivite_id,
                   far.tag_id,
                   far.user_id
            FROM fiche_action_referent far
            LEFT JOIN personne_tag pt ON far.tag_id = pt.id
            LEFT JOIN dcp ON dcp.user_id = far.user_id
            WHERE far.fiche_id = fa.id
            ) ref
       ) AS referents,
       pla.axes,
       act.actions,
       (
       SELECT array_agg(ROW (
         indi.id,
         indi.groupement_id,
         indi.collectivite_id,
         indi.identifiant_referentiel,
         indi.titre,
         indi.titre_long,
         indi.description,
         indi.unite,
         indi.borne_min,
         indi.borne_max,
         indi.participation_score,
         indi.sans_valeur_utilisateur,
         indi.valeur_calcule,
         indi.modified_at,
         indi.created_at,
         indi.modified_by,
         indi.created_by,
         NULL::text,
         NULL::character varying(16),
         NULL::integer,
         NULL,
         NULL,
         NULL
         )::indicateur_definition) AS array_agg
       FROM (
            SELECT id.id,
                   id.groupement_id,
                   id.collectivite_id,
                   id.identifiant_referentiel,
                   id.titre,
                   id.titre_long,
                   id.description,
                   id.unite,
                   id.borne_min,
                   id.borne_max,
                   id.participation_score,
                   id.sans_valeur_utilisateur,
                   id.valeur_calcule,
                   id.modified_at,
                   id.created_at,
                   id.modified_by,
                   id.created_by
            FROM fiche_action_indicateur fai
            JOIN indicateur_definition id ON fai.indicateur_id::text = id.id::text
            WHERE fai.fiche_id = fa.id
            ) indi
       ) AS indicateurs,
       ser.services,
       lib.libres_tag,
       (
       SELECT array_agg(ROW (fin.financeur_tag, fin.montant_ttc, fin.id)::financeur_montant) AS financeurs
       FROM (
            SELECT ft.*::financeur_tag AS financeur_tag,
                   faft.montant_ttc,
                   faft.id
            FROM financeur_tag ft
            JOIN fiche_action_financeur_tag faft ON ft.id = faft.financeur_tag_id
            WHERE faft.fiche_id = fa.id
            ) fin
       ) AS financeurs,
       fic.fiches_liees,
       fa.restreint
FROM fiche_action fa
LEFT JOIN (
          SELECT fath.fiche_id,
                 array_agg(th.*) AS thematiques
          FROM thematique th
          JOIN fiche_action_thematique fath ON fath.thematique_id = th.id
          GROUP BY fath.fiche_id
          ) t ON t.fiche_id = fa.id
LEFT JOIN (
          SELECT fasth.fiche_id,
                 array_agg(sth.*) AS sous_thematiques
          FROM sous_thematique sth
          JOIN fiche_action_sous_thematique fasth ON fasth.thematique_id = sth.id
          GROUP BY fasth.fiche_id
          ) st ON st.fiche_id = fa.id
LEFT JOIN (
          SELECT fapt.fiche_id,
                 array_agg(pt.*) AS partenaires
          FROM partenaire_tag pt
          JOIN fiche_action_partenaire_tag fapt ON fapt.partenaire_tag_id = pt.id
          GROUP BY fapt.fiche_id
          ) p ON p.fiche_id = fa.id
LEFT JOIN (
          SELECT fast.fiche_id,
                 array_agg(st_1.*) AS structures
          FROM structure_tag st_1
          JOIN fiche_action_structure_tag fast ON fast.structure_tag_id = st_1.id
          GROUP BY fast.fiche_id
          ) s ON s.fiche_id = fa.id
LEFT JOIN (
          SELECT fapa.fiche_id,
                 array_agg(pa.*) AS axes
          FROM axe pa
          JOIN fiche_action_axe fapa ON fapa.axe_id = pa.id
          GROUP BY fapa.fiche_id
          ) pla ON pla.fiche_id = fa.id
LEFT JOIN (
          SELECT faa.fiche_id,
                 array_agg(ar.*) AS actions
          FROM action_relation ar
          JOIN fiche_action_action faa ON faa.action_id::text = ar.id::text
          GROUP BY faa.fiche_id
          ) act ON act.fiche_id = fa.id
LEFT JOIN (
          SELECT fast.fiche_id,
                 array_agg(st_1.*) AS services
          FROM service_tag st_1
          JOIN fiche_action_service_tag fast ON fast.service_tag_id = st_1.id
          GROUP BY fast.fiche_id
          ) ser ON ser.fiche_id = fa.id
LEFT JOIN (
          SELECT falt.fiche_id,
                 array_agg(lt_1.*) AS libres_tag
          FROM libre_tag lt_1
          JOIN fiche_action_libre_tag falt ON falt.libre_tag_id = lt_1.id
          GROUP BY falt.fiche_id
          ) lib ON lib.fiche_id = fa.id
LEFT JOIN (
          SELECT falpf.fiche_id,
                 array_agg(fr.*) AS fiches_liees
          FROM private.fiche_resume fr
          JOIN fiches_liees_par_fiche falpf ON falpf.fiche_liee_id = fr.id
          GROUP BY falpf.fiche_id
          ) fic ON fic.fiche_id = fa.id
LEFT JOIN (
          SELECT faea.fiche_id,
                 array_agg(ea.*) AS resultats_attendus
          FROM effet_attendu ea
          JOIN fiche_action_effet_attendu faea ON ea.id = faea.effet_attendu_id
          GROUP BY faea.fiche_id
          ) eff ON eff.fiche_id = fa.id
LEFT JOIN action_impact_temps_de_mise_en_oeuvre tmo
          ON tmo.niveau = fa.temps_de_mise_en_oeuvre_id
LEFT JOIN dcp created_user
          ON created_user.user_id = fa.created_by
LEFT JOIN dcp modified_user
          ON modified_user.user_id = fa.modified_by
;

-- 6. public.fiches_action
CREATE OR REPLACE VIEW public.fiches_action AS
SELECT *
FROM private.fiches_action
WHERE CASE
        WHEN fiches_action.restreint = true THEN have_lecture_acces(fiches_action.collectivite_id) OR est_support()
        ELSE can_read_acces_restreint(fiches_action.collectivite_id)
      END;

-- 7. upsert_fiche_action (from plan_action/fiches@v4.13.0, without notes_complementaires)
CREATE OR REPLACE FUNCTION public.upsert_fiche_action() RETURNS trigger
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
DECLARE
    id_fiche        integer;
    thematique      thematique;
    sous_thematique sous_thematique;
    axe             axe;
    partenaire      partenaire_tag;
    structure       structure_tag;
    pilote          personne;
    referent        personne;
    action          action_relation;
    indicateur      indicateur_definition;
    service         service_tag;
    financeur       financeur_montant;
    fiche_liee      fiche_resume;
    effet_attendu   effet_attendu;
BEGIN
    id_fiche = new.id;
    IF NOT have_edition_acces(new.collectivite_id) AND NOT is_service_role() THEN
        PERFORM set_config('response.status', '401', true);
        RAISE 'Modification non autorisé.';
    END IF;
    -- Fiche action
    IF id_fiche IS NULL THEN
        INSERT INTO fiche_action (titre,
                                  description,
                                  piliers_eci,
                                  objectifs,
                                  cibles,
                                  ressources,
                                  financements,
                                  budget_previsionnel,
                                  statut,
                                  niveau_priorite,
                                  date_debut,
                                  date_fin_provisoire,
                                  amelioration_continue,
                                  calendrier,
                                  maj_termine,
                                  collectivite_id,
                                  restreint)
        VALUES (new.titre,
                new.description,
                new.piliers_eci,
                new.objectifs,
                new.cibles,
                new.ressources,
                new.financements,
                new.budget_previsionnel,
                new.statut,
                new.niveau_priorite,
                new.date_debut,
                new.date_fin_provisoire,
                new.amelioration_continue,
                new.calendrier,
                new.maj_termine,
                new.collectivite_id,
                new.restreint)
        RETURNING id INTO id_fiche;
        new.id = id_fiche;
    ELSE
        UPDATE fiche_action
        SET titre                = new.titre,
            description          = new.description,
            piliers_eci          = new.piliers_eci,
            objectifs            = new.objectifs,
            cibles               = new.cibles,
            ressources           = new.ressources,
            financements         = new.financements,
            budget_previsionnel  = new.budget_previsionnel,
            statut               = new.statut,
            niveau_priorite      = new.niveau_priorite,
            date_debut           = new.date_debut,
            date_fin_provisoire  = new.date_fin_provisoire,
            amelioration_continue = new.amelioration_continue,
            calendrier           = new.calendrier,
            maj_termine          = new.maj_termine,
            collectivite_id      = new.collectivite_id,
            restreint            = new.restreint
        WHERE id = id_fiche;
    END IF;

    -- Thématiques
    DELETE FROM fiche_action_thematique WHERE fiche_id = id_fiche;
    IF new.thematiques IS NOT NULL THEN
        FOREACH thematique IN ARRAY new.thematiques::thematique[]
            LOOP
                PERFORM private.ajouter_thematique(id_fiche, thematique.nom);
            END LOOP;
    END IF;
    DELETE FROM fiche_action_sous_thematique WHERE fiche_id = id_fiche;
    IF new.sous_thematiques IS NOT NULL THEN
        FOREACH sous_thematique IN ARRAY new.sous_thematiques::sous_thematique[]
            LOOP
                PERFORM private.ajouter_sous_thematique(id_fiche, sous_thematique.id);
            END LOOP;
    END IF;

    -- Axes
    DELETE FROM fiche_action_axe WHERE fiche_id = id_fiche;
    IF new.axes IS NOT NULL THEN
        FOREACH axe IN ARRAY new.axes::axe[]
            LOOP
                PERFORM ajouter_fiche_action_dans_un_axe(id_fiche, axe.id);
            END LOOP;
    END IF;

    -- Partenaires
    DELETE FROM fiche_action_partenaire_tag WHERE fiche_id = id_fiche;
    IF new.partenaires IS NOT NULL THEN
        FOREACH partenaire IN ARRAY new.partenaires::partenaire_tag[]
            LOOP
                PERFORM private.ajouter_partenaire(id_fiche, partenaire);
            END LOOP;
    END IF;

    -- Structures
    DELETE FROM fiche_action_structure_tag WHERE fiche_id = id_fiche;
    IF new.structures IS NOT NULL THEN
        FOREACH structure IN ARRAY new.structures
            LOOP
                PERFORM private.ajouter_structure(id_fiche, structure);
            END LOOP;
    END IF;

    -- Pilotes
    DELETE FROM fiche_action_pilote WHERE fiche_id = id_fiche;
    IF new.pilotes IS NOT NULL THEN
        FOREACH pilote IN ARRAY new.pilotes::personne[]
            LOOP
                PERFORM private.ajouter_pilote(id_fiche, pilote);
            END LOOP;
    END IF;

    -- Referents
    DELETE FROM fiche_action_referent WHERE fiche_id = id_fiche;
    IF new.referents IS NOT NULL THEN
        FOREACH referent IN ARRAY new.referents::personne[]
            LOOP
                PERFORM private.ajouter_referent(id_fiche, referent);
            END LOOP;
    END IF;

    -- Actions
    DELETE FROM fiche_action_action WHERE fiche_id = id_fiche;
    IF new.actions IS NOT NULL THEN
        FOREACH action IN ARRAY new.actions::action_relation[]
            LOOP
                PERFORM private.ajouter_action(id_fiche, action.id);
            END LOOP;
    END IF;

    -- Indicateurs
    DELETE FROM fiche_action_indicateur WHERE fiche_id = id_fiche;
    IF new.indicateurs IS NOT NULL THEN
        FOREACH indicateur IN ARRAY new.indicateurs::indicateur_definition[]
            LOOP
                PERFORM private.ajouter_indicateur(id_fiche, indicateur);
            END LOOP;
    END IF;

    -- Services
    DELETE FROM fiche_action_service_tag WHERE fiche_id = id_fiche;
    IF new.services IS NOT NULL THEN
        FOREACH service IN ARRAY new.services
            LOOP
                PERFORM private.ajouter_service(id_fiche, service);
            END LOOP;
    END IF;

    -- Financeurs
    DELETE FROM fiche_action_financeur_tag WHERE fiche_id = id_fiche;
    IF new.financeurs IS NOT NULL THEN
        FOREACH financeur IN ARRAY new.financeurs::financeur_montant[]
            LOOP
                PERFORM private.ajouter_financeur(id_fiche, financeur);
            END LOOP;
    END IF;

    -- Fiches liees
    DELETE FROM fiche_action_lien WHERE fiche_une = id_fiche OR fiche_deux = id_fiche;
    IF new.fiches_liees IS NOT NULL THEN
        FOREACH fiche_liee IN ARRAY new.fiches_liees::private.fiche_resume[]
            LOOP
                INSERT INTO fiche_action_lien (fiche_une, fiche_deux)
                VALUES (id_fiche, fiche_liee.id);
            END LOOP;
    END IF;

    -- Effets attendus
    DELETE FROM fiche_action_effet_attendu WHERE fiche_id = id_fiche;
    IF new.resultats_attendus IS NOT NULL THEN
        FOREACH effet_attendu IN ARRAY new.resultats_attendus::effet_attendu[]
            LOOP
                INSERT INTO fiche_action_effet_attendu (fiche_id, effet_attendu_id)
                VALUES (id_fiche, effet_attendu.id);
            END LOOP;
    END IF;

    RETURN new;
END;
$$;

CREATE TRIGGER upsert
    INSTEAD OF INSERT OR UPDATE
    ON public.fiches_action
    FOR EACH ROW
    EXECUTE FUNCTION public.upsert_fiche_action();

-- 8. plan_action_export (from notes_complementaires_column_deletion)
CREATE OR REPLACE FUNCTION public.plan_action_export(id integer)
    RETURNS SETOF fiche_action_export
    LANGUAGE sql
BEGIN ATOMIC
WITH RECURSIVE parents AS (
          SELECT axe.id,
             axe.nom,
             axe.collectivite_id,
             0 AS depth,
             ARRAY[]::text[] AS path,
             ('0 '::text || axe.nom) AS sort_path
            FROM axe
           WHERE ((axe.parent IS NULL) AND (axe.id = plan_action_export.id) AND can_read_acces_restreint(axe.collectivite_id))
         UNION ALL
          SELECT a.id,
             a.nom,
             a.collectivite_id,
             (p_1.depth + 1),
             (p_1.path || p_1.nom),
             ((((p_1.sort_path || ' '::text) || (p_1.depth + 1)) || ' '::text) || a.nom)
            FROM (parents p_1
              JOIN axe a ON ((a.parent = p_1.id)))
         ), fiches AS (
          SELECT a.id AS axe_id,
             f_1.*::fiches_action AS fiche,
             f_1.titre
            FROM ((parents a
              JOIN fiche_action_axe faa ON ((a.id = faa.axe_id)))
              JOIN fiches_action f_1 ON (((f_1.collectivite_id = a.collectivite_id) AND (faa.fiche_id = f_1.id))))
         )
  SELECT p.id,
     p.nom,
     p.path,
     to_jsonb(f.*) AS to_jsonb
    FROM (parents p
      LEFT JOIN fiches f ON ((p.id = f.axe_id)))
   ORDER BY (naturalsort((p.sort_path || (COALESCE(f.titre, ''::character varying))::text)));
END;

-- 9. filter_fiches_action (from plan_action/fiches@v2.102.0)
CREATE OR REPLACE FUNCTION public.filter_fiches_action(
    collectivite_id integer,
    sans_plan boolean DEFAULT false,
    axes_id integer[] DEFAULT NULL::integer[],
    sans_pilote boolean DEFAULT false,
    pilotes personne[] DEFAULT NULL::personne[],
    sans_referent boolean DEFAULT false,
    referents personne[] DEFAULT NULL::personne[],
    sans_niveau boolean DEFAULT false,
    niveaux_priorite fiche_action_niveaux_priorite[] DEFAULT NULL::fiche_action_niveaux_priorite[],
    sans_statut boolean DEFAULT false,
    statuts fiche_action_statuts[] DEFAULT NULL::fiche_action_statuts[],
    sans_budget boolean DEFAULT false,
    budget_min integer DEFAULT NULL::integer,
    budget_max integer DEFAULT NULL::integer,
    sans_date boolean DEFAULT false,
    date_debut timestamptz DEFAULT NULL,
    date_fin timestamptz DEFAULT NULL,
    echeance fiche_action_echeances DEFAULT NULL,
    "limit" integer DEFAULT 10
) RETURNS SETOF fiche_resume
    STABLE
    SECURITY DEFINER
    LANGUAGE plpgsql
AS
$$
    # variable_conflict use_variable
BEGIN
    IF NOT can_read_acces_restreint(filter_fiches_action.collectivite_id) THEN
        PERFORM set_config('response.status', '403', true);
        RAISE 'L''utilisateur n''a pas de droit en lecture sur la collectivité.';
    END IF;

    RETURN QUERY
        SELECT fr.*
        FROM fiche_resume fr
                 JOIN fiche_action fa ON fr.id = fa.id
        WHERE fr.collectivite_id = filter_fiches_action.collectivite_id
          AND CASE
                  WHEN sans_plan THEN
                      fr.id NOT IN (SELECT DISTINCT fiche_id FROM fiche_action_axe)
                  WHEN axes_id IS NULL THEN true
                  ELSE fr.id IN (WITH child AS (SELECT a.axe_id AS axe_id
                                               FROM axe_descendants a
                                               WHERE a.parents && (axes_id)
                                                  OR a.axe_id IN (SELECT * FROM unnest(axes_id)))
                                 SELECT fiche_id
                                 FROM child
                                          JOIN fiche_action_axe USING (axe_id))
            END
          AND CASE
                  WHEN sans_pilote THEN
                      fr.id NOT IN (SELECT DISTINCT fiche_id FROM fiche_action_pilote)
                  WHEN pilotes IS NULL THEN true
                  ELSE fr.id IN
                       (SELECT fap.fiche_id
                        FROM fiche_action_pilote fap
                        WHERE fap.tag_id IN (SELECT (pi::personne).tag_id FROM unnest(pilotes) pi)
                           OR fap.user_id IN (SELECT (pi::personne).user_id FROM unnest(pilotes) pi))
            END
          AND CASE
                  WHEN sans_referent THEN
                      fr.id NOT IN (SELECT DISTINCT fiche_id FROM fiche_action_referent)
                  WHEN referents IS NULL THEN true
                  ELSE fr.id IN
                       (SELECT far.fiche_id
                        FROM fiche_action_referent far
                        WHERE far.tag_id IN (SELECT (re::personne).tag_id FROM unnest(referents) re)
                           OR far.user_id IN (SELECT (re::personne).user_id FROM unnest(referents) re))
            END
          AND CASE
                  WHEN sans_niveau THEN fa.niveau_priorite IS NULL
                  WHEN niveaux_priorite IS NULL THEN true
                  ELSE fa.niveau_priorite IN (SELECT * FROM unnest(niveaux_priorite::fiche_action_niveaux_priorite[]))
            END
          AND CASE
                  WHEN sans_statut THEN fa.statut IS NULL
                  WHEN statuts IS NULL THEN true
                  ELSE fr.statut IN (SELECT * FROM unnest(statuts::fiche_action_statuts[]))
            END
          AND CASE
                  WHEN sans_budget THEN fa.budget_previsionnel IS NULL
                  WHEN budget_min IS NULL THEN true
                  WHEN fa.budget_previsionnel IS NULL THEN false
                  ELSE fa.budget_previsionnel >= budget_min
            END
          AND CASE
                  WHEN sans_budget THEN fa.budget_previsionnel IS NULL
                  WHEN budget_max IS NULL THEN true
                  WHEN fa.budget_previsionnel IS NULL THEN false
                  ELSE fa.budget_previsionnel <= budget_max
            END
          AND CASE
                  WHEN sans_date THEN fa.date_debut IS NULL
                  WHEN filter_fiches_action.date_debut IS NULL THEN true
                  WHEN fa.date_debut IS NULL THEN false
                  ELSE fa.date_debut <= filter_fiches_action.date_debut
            END
          AND CASE
                  WHEN sans_date THEN fa.date_fin_provisoire IS NULL
                  WHEN date_fin IS NULL THEN true
                  WHEN fa.date_fin_provisoire IS NULL THEN false
                  ELSE fa.date_fin_provisoire <= date_fin
            END
          AND CASE
                  WHEN echeance IS NULL THEN true
                  WHEN echeance = 'Action en amélioration continue'
                      THEN fa.amelioration_continue
                  WHEN echeance = 'Sans échéance'
                      THEN fa.date_fin_provisoire IS NULL
                  WHEN echeance = 'Échéance dépassée'
                      THEN fa.date_fin_provisoire > now()
                  WHEN echeance = 'Échéance dans moins de trois mois'
                      THEN fa.date_fin_provisoire < (now() + interval '3 months')
                  WHEN echeance = 'Échéance entre trois mois et 1 an'
                      THEN fa.date_fin_provisoire >= (now() + interval '3 months')
                      AND fa.date_fin_provisoire < (now() + interval '1 year')
                  WHEN echeance = 'Échéance dans plus d''un an'
                      THEN fa.date_fin_provisoire > (now() + interval '1 year')
                  ELSE false
            END
        ORDER BY naturalsort(fr.titre)
        LIMIT filter_fiches_action."limit";
END;
$$;

-- 10. fiche_action_personne_referente (from plan_action/plan_action@v2.1.0)
CREATE VIEW public.fiche_action_personne_referente AS
SELECT t.collectivite_id,
       t.nom,
       NULL::uuid AS user_id,
       t.id       AS tag_id
FROM personne_tag t
WHERE have_lecture_acces(t.collectivite_id)
UNION ALL
SELECT m.collectivite_id,
       dcp.nom || ' ' || dcp.prenom,
       m.user_id,
       NULL
FROM private_collectivite_membre m
         JOIN utilisateur.dcp_display dcp ON dcp.user_id = m.user_id
WHERE have_lecture_acces(m.collectivite_id);

COMMENT ON VIEW fiche_action_personne_referente IS
    'Permet de lister les referents possibles pour les fiches actions.';

-- 11. plan_action view (from plan_action/plan_action@v2.4.0)
CREATE VIEW public.plan_action AS
SELECT a.collectivite_id, a.id, plan_action(a.id) AS plan
FROM axe a
WHERE a.parent IS NULL;

COMMIT;
