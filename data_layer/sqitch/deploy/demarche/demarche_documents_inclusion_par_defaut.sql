-- Deploy tet:demarche/demarche_documents_inclusion_par_defaut to pg
-- requires: demarche/demarche_documents_substitution_unique

BEGIN;

-- ===========================================================================
-- `automatic` n'est plus une couverture perpétuelle mais un défaut : la case
-- « inclus dans … » naît cochée au dépôt du document qui accueille l'inclusion,
-- et la collectivité peut la décocher. La couverture ne se déduit donc plus, on
-- la lit — d'où le rattrapage des dossiers en cours : partout où le document
-- substitut est déjà déposé, la déclaration qui était implicite devient une
-- ligne, sauf si la pièce a son propre dépôt.
-- ===========================================================================
INSERT INTO public.demarche_document
    (collectivite_id, demarche_id, document_id, modified_at)
SELECT substitut.collectivite_id,
       substitut.demarche_id,
       substitution.document_id,
       now()
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
  );

COMMENT ON COLUMN public.demarche_document_substitution.automatic IS
    'true : le dépôt de substitut_id coche par défaut l''inclusion de document_id, que la collectivité peut décocher. false : la case naît décochée, l''inclusion se déclare.';

COMMIT;
