-- Verify tet:demarche/demarche_documents_inclusion_par_defaut on pg

BEGIN;

DO $$
BEGIN
    -- Plus aucune couverture implicite : là où un substitut automatique est
    -- déposé, l'inclusion de la pièce est écrite, ou la pièce a son dépôt.
    ASSERT (
        SELECT COUNT(*) = 0
        FROM public.demarche_document_substitution AS substitution
        JOIN public.demarche_document AS substitut
          ON substitut.document_id = substitution.substitut_id
         AND substitut.fichier_id IS NOT NULL
        WHERE substitution.automatic
          AND NOT EXISTS (
              SELECT 1
              FROM public.demarche_document AS existant
              WHERE existant.demarche_id = substitut.demarche_id
                AND existant.document_id = substitution.document_id
          )
    ), 'Toute inclusion automatique dont le substitut est déposé doit être écrite en base';
END $$;

ROLLBACK;
