-- Revert tet:indicateur/periodicite from pg

BEGIN;

-- Prendre le verrou du graphe avant les tables respecte le même ordre que les
-- writers applicatifs et les triggers statement-level. Une fois exclusif, le
-- revert peut retirer ces triggers sans qu'une écriture ne s'intercale.
SELECT pg_advisory_xact_lock(
    hashtextextended('indicateur-calculation-graph', 0)
);
LOCK TABLE public.indicateur_definition IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE public.indicateur_valeur IN SHARE ROW EXCLUSIVE MODE;
SELECT migration.verifier_retrait_periodicite_indicateur();

DROP TRIGGER IF EXISTS verrouiller_graphe_calcul_indicateur_valeur
    ON public.indicateur_valeur;
DROP TRIGGER IF EXISTS verrouiller_graphe_calcul_indicateur_definition_update
    ON public.indicateur_definition;
DROP TRIGGER IF EXISTS verrouiller_graphe_calcul_indicateur_definition
    ON public.indicateur_definition;
DROP FUNCTION IF EXISTS public.verrouiller_graphe_calcul_indicateur_partage();
DROP FUNCTION IF EXISTS public.verrouiller_graphe_calcul_indicateur_exclusif();

-- Retire la dépendance de la fonction publique à la colonne avant de
-- supprimer celle-ci, et restaure exactement le contrat antérieur : la
-- cadence n'était pas encore transportée dans chaque entrée JSON.
CREATE OR REPLACE FUNCTION public.indicateurs_gaz_effet_serre(site_labellisation)
    RETURNS jsonb
    SECURITY DEFINER
    LANGUAGE sql
BEGIN ATOMIC
SELECT to_jsonb(array_agg(d))
FROM (
    SELECT iri.date_valeur,
           iri.resultat,
           id.identifiant_referentiel AS identifiant,
           src.libelle AS source
    FROM indicateur_valeur iri
    JOIN indicateur_definition id ON iri.indicateur_id = id.id
    JOIN indicateur_source_metadonnee ism ON ism.id = iri.metadonnee_id
    JOIN indicateur_source src ON src.id = ism.source_id
    WHERE iri.collectivite_id = ($1).collectivite_id
      AND iri.metadonnee_id IS NOT NULL
      AND iri.resultat IS NOT NULL
      AND src.id IN ('citepa')
      AND id.identifiant_referentiel::text = ANY (
          ARRAY [
              'cae_1.g'::character varying,
              'cae_1.f'::character varying,
              'cae_1.h'::character varying,
              'cae_1.j'::character varying,
              'cae_1.i'::character varying,
              'cae_1.c'::character varying,
              'cae_1.e'::character varying,
              'cae_1.d'::character varying,
              'cae_1.a'::character varying
          ]::text[]
      )
) d;
END;

DROP TRIGGER IF EXISTS empecher_periodicite_non_annuelle_pendant_retrait
    ON public.indicateur_definition;
DROP FUNCTION IF EXISTS migration.empecher_periodicite_non_annuelle_pendant_retrait();

DROP TRIGGER IF EXISTS auditer_et_normaliser_date_indicateur_en_transition
    ON public.indicateur_valeur;
DROP FUNCTION IF EXISTS migration.auditer_et_normaliser_date_indicateur_en_transition();

-- Doit être retiré avant la restauration des dates, sinon cette restauration
-- invaliderait précisément les audits qu'elle doit encore consommer.
DROP TRIGGER IF EXISTS assainir_audit_periodicite_indicateur
    ON public.indicateur_valeur;
DROP FUNCTION IF EXISTS migration.assainir_audit_periodicite_indicateur();

DROP TRIGGER IF EXISTS empecher_changement_periodicite_indicateur
    ON public.indicateur_definition;
DROP FUNCTION IF EXISTS public.empecher_changement_periodicite_indicateur();

DROP TRIGGER IF EXISTS verifier_periodicite_groupe_indicateur
    ON public.indicateur_groupe;
DROP FUNCTION IF EXISTS public.verifier_periodicite_groupe_indicateur();

-- Restaure uniquement les dates que le déploiement avait effectivement
-- normalisées. Les conflits n'ont jamais été modifiés.
-- Une écriture effectuée pendant la transition peut avoir repris exactement
-- la date historique d'une ligne normalisée. Refuser explicitement le revert
-- conserve alors tout l'état et indique la remédiation attendue, plutôt que de
-- laisser la contrainte d'unicité produire une erreur opaque au milieu de la
-- restauration.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM migration.indicateur_valeur_periodicite_audit audit
        JOIN public.indicateur_valeur valeur
          ON valeur.id = audit.valeur_id
        JOIN public.indicateur_valeur autre
          ON autre.id <> valeur.id
         AND autre.indicateur_id = valeur.indicateur_id
         AND autre.collectivite_id = valeur.collectivite_id
         AND autre.metadonnee_id IS NOT DISTINCT FROM valeur.metadonnee_id
         AND autre.date_valeur = audit.date_valeur_avant
        WHERE audit.statut = 'normalisee'
          AND valeur.indicateur_id = audit.indicateur_id
          AND valeur.collectivite_id = audit.collectivite_id
          AND valeur.metadonnee_id IS NOT DISTINCT FROM audit.metadonnee_id
          AND valeur.date_valeur = audit.date_valeur_canonique
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = '23505',
            MESSAGE = 'Le revert de la périodicité restaurerait une date historique désormais occupée ; remédier les lignes listées dans migration.indicateur_valeur_periodicite_audit';
    END IF;
END $$;

ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_at;
ALTER TABLE public.indicateur_valeur DISABLE TRIGGER modified_by;
UPDATE public.indicateur_valeur valeur
SET date_valeur = audit.date_valeur_avant
FROM migration.indicateur_valeur_periodicite_audit audit
WHERE audit.valeur_id = valeur.id
  AND audit.statut = 'normalisee'
  -- Une ligne peut avoir été volontairement réaffectée après la migration.
  -- Dans ce cas, l'ancien tuple audité ne décrit plus son identité et sa date
  -- historique ne doit surtout pas lui être réappliquée.
  AND valeur.indicateur_id = audit.indicateur_id
  AND valeur.collectivite_id = audit.collectivite_id
  AND valeur.metadonnee_id IS NOT DISTINCT FROM audit.metadonnee_id
  AND valeur.date_valeur = audit.date_valeur_canonique;
ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_by;
ALTER TABLE public.indicateur_valeur ENABLE TRIGGER modified_at;

DROP FUNCTION IF EXISTS migration.auditer_et_normaliser_dates_indicateur();
DROP TABLE migration.indicateur_valeur_periodicite_audit;
DROP FUNCTION migration.verifier_retrait_periodicite_indicateur();

ALTER TABLE public.indicateur_definition
    DROP COLUMN periodicite;

DROP TRIGGER empecher_modification_periodicite
    ON public.indicateur_periodicite;
DROP FUNCTION public.empecher_modification_periodicite();
DROP FUNCTION public.indicateur_date_debut_periode(text, date);
DROP TABLE public.indicateur_periodicite;

COMMIT;
