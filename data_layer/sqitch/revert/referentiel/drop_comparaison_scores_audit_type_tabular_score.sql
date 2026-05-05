-- Revert tet:referentiel/drop_comparaison_scores_audit_type_tabular_score from pg

BEGIN;

-- Recreates public.action_referentiel as in referentiel/vue_tabulaire@v2.11.0 (last definition before drop).

CREATE MATERIALIZED VIEW public.action_referentiel
AS
SELECT ah.action_id,
       ah.referentiel,
       ah.descendants,
       ah.leaves,
       ah.have_children,
       ah.ascendants,
       ah.depth,
       ah.type,
       ad.identifiant,
       ad.nom,
       ad.description,
       ad.categorie                  AS phase,
       ad.exemples != ''             AS have_exemples,
       ad.preuve != ''               AS have_preuve,
       ad.ressources != ''           AS have_ressources,
       ad.reduction_potentiel != ''  AS have_reduction_potentiel,
       ad.perimetre_evaluation != '' AS have_perimetre_evaluation,
       ad.contexte != ''             AS have_contexte
FROM private.action_hierarchy ah
         LEFT JOIN public.action_definition ad ON ah.action_id = ad.action_id;

COMMENT ON MATERIALIZED VIEW public.action_referentiel IS
    'La vue matérialisée utilisée comme tronc commun pour les vues tabulaires dans le client.';

REFRESH MATERIALIZED VIEW public.action_referentiel;

COMMIT;
