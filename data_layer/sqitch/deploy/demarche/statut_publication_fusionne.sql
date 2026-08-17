-- Deploy tet:demarche/statut_publication_fusionne to pg
-- requires: demarche/demarche

BEGIN;

-- La mise à disposition du public n'est pas une dimension parallèle du dossier
-- mais une étape de son cycle : on ne publie qu'un dossier adopté, et on
-- n'archive qu'un dossier publié. `publication_status` disparaît donc au profit
-- d'un statut unique, et `published_at` garde la date de mise en ligne.
-- La contrainte d'origine porte le nom auto-généré `demarche_check` et non
-- `demarche_status_check` : elle est écrite au niveau de la colonne mais
-- référence `type` et `status`, et Postgres ne nomme d'après la colonne que
-- les CHECK qui n'en touchent qu'une. On la renomme au passage.
ALTER TABLE public.demarche DROP CONSTRAINT demarche_check;

UPDATE public.demarche
SET status = 'publie'
WHERE type = 'pcaet' AND status = 'adopte' AND publication_status = 'published';

ALTER TABLE public.demarche ADD CONSTRAINT demarche_status_check CHECK (
    type = 'pcaet' AND status IN (
    'en_elaboration', 'transmis_pour_avis', 'adopte', 'publie', 'archive'));

ALTER TABLE public.demarche DROP COLUMN publication_status;

COMMENT ON COLUMN public.demarche.status IS
    'Cycle de vie du dépôt, propre au type. PCAET : en_elaboration → transmis_pour_avis (préfet de région, conseil régional, MRAe) → adopte (mise en œuvre 6 ans) → publie (mise à disposition du public) → archive. Transitions gérées par le domaine demarches.';
COMMENT ON COLUMN public.demarche.published_at IS
    'Date de la dernière mise à disposition du public (NULL si la démarche n''est pas publiée).';

COMMIT;
