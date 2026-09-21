-- Deploy tet:demarche/pcaet_vulnerabilite_transport to pg
-- requires: demarche/pcaet_vulnerabilite_sous_thematiques

BEGIN;

-- ===========================================================================
-- Le transport rejoint le socle, derrière les risques naturels. Le code était
-- libre : il figurait dans la liste indicative du cadre de dépôt, écartée par
-- demarche/pcaet_vulnerabilite_thematique_socle_recadre, et le rang 11 le
-- range après « Risques naturels » (10) et ses huit sous-thématiques, dont le
-- tri de lecture suit celui de leur parente.
--
-- Rejouable comme les INSERT de socle qui précèdent : une migration ultérieure
-- fera évoluer le libellé en réexécutant ce même INSERT. L'ON CONFLICT couvre
-- aussi la base où le socle recadré n'est pas encore déployé, et où le code
-- « transport » existe donc toujours au rang 16.
--
-- Aucune ligne de saisie n'est créée : contrairement à une thématique ajoutée
-- par une collectivité, une thématique du socle est servie sans rattachement,
-- sa ligne est fabriquée vierge à la lecture, et la première saisie l'insère
-- (upsert). Une reprise ne ferait qu'ajouter des lignes vides.
-- ===========================================================================
INSERT INTO public.demarche_pcaet_vulnerabilite_thematique
    (code, label, collectivite_id, requis, display_order, parent_id)
VALUES
    ('transport', 'Transport', NULL, true, 11, NULL)
ON CONFLICT (code) WHERE collectivite_id IS NULL DO UPDATE
    SET label         = EXCLUDED.label,
        requis        = EXCLUDED.requis,
        display_order = EXCLUDED.display_order,
        parent_id     = EXCLUDED.parent_id,
        modified_at   = now();

COMMIT;
