-- Revert tet:demarche/demarche_documents_inclusion_par_defaut from pg

BEGIN;

-- Les déclarations matérialisées redeviennent implicites : on retire celles qui
-- portent sur une substitution automatique dont le substitut est déposé, ce que
-- le calcul de couverture savait déduire seul.
DELETE FROM public.demarche_document AS declaration
USING public.demarche_document_substitution AS substitution,
      public.demarche_document AS substitut
WHERE declaration.fichier_id IS NULL
  AND declaration.document_id = substitution.document_id
  AND substitution.automatic
  AND substitut.document_id = substitution.substitut_id
  AND substitut.demarche_id = declaration.demarche_id
  AND substitut.fichier_id IS NOT NULL;

COMMENT ON COLUMN public.demarche_document_substitution.automatic IS
    'true : déposer substitut_id couvre document_id sans rien demander. false : la collectivité déclare, pièce par pièce, que document_id est compris dans substitut_id.';

COMMIT;
