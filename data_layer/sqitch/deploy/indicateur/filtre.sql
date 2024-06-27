-- Deploy tet:indicateur/filtre to pg

BEGIN;

-- Nouveaux index sur les colonnes utilisées dans les requêtes de jointures
-- liées aux filtres sur les indicateurs, en particulier utilisant la fonction axes ci-dessous.

CREATE INDEX IF NOT EXISTS fiche_action_indicateur_indicateur_id_idx 
    ON fiche_action_indicateur (indicateur_id);

CREATE INDEX IF NOT EXISTS fiche_action_indicateur_fiche_id_idx 
    ON fiche_action_indicateur (fiche_id);

CREATE INDEX IF NOT EXISTS fiche_action_indicateur_indicateur_personnalise_id_idx 
    ON fiche_action_indicateur (indicateur_personnalise_id);

CREATE INDEX IF NOT EXISTS fiche_action_axe_axe_id_idx
    ON fiche_action_axe (axe_id);

CREATE INDEX IF NOT EXISTS indicateur_definition_valeur_indicateur_idx
    ON indicateur_definition (valeur_indicateur);


-- Nouvelle version de la fonction axes qui ne fait pas de LEFT JOIN sur la table indicateur_definition
-- qui résout les problèmes de performance. (20s -> 0.1s quand appelée depuis la vue indicateur_definitions)
CREATE OR REPLACE FUNCTION public.axes(indicateur_definitions)
 RETURNS SETOF axe
 LANGUAGE sql
 STABLE SECURITY DEFINER
BEGIN ATOMIC
    select axe.*
    from (
        select fai.fiche_id
        from indicateur_definition def
        join fiche_action_indicateur fai on def.id = fai.indicateur_id
        join fiche_action fa on fai.fiche_id = fa.id
        where (def.id = $1.indicateur_id or def.valeur_indicateur = $1.indicateur_id)
        and fa.collectivite_id = $1.collectivite_id
        
        UNION
        
        select fai.fiche_id
        from indicateur_personnalise_definition def
        join fiche_action_indicateur fai on def.id = fai.indicateur_personnalise_id
        where def.id = $1.indicateur_perso_id
        and def.collectivite_id = $1.collectivite_id
        
        ) f
    join fiche_action_axe faa on faa.fiche_id = f.fiche_id
    join axe on faa.axe_id = axe.id;
END;



COMMIT;
