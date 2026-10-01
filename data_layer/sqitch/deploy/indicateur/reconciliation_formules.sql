-- Deploy tet:indicateur/reconciliation_formules to pg
-- requires: indicateur/periodicite
-- requires: private_schema

BEGIN;

-- Source de vérité durable du recalcul déclenché par une mutation de formule.
-- Une ligne est une unité de travail bornée : une cible, une génération et une
-- collectivité. Elle n'est supprimée que dans la transaction qui a terminé le
-- recalcul (ou constaté que sa génération est devenue obsolète).
CREATE TABLE private.indicateur_reconciliation_formule
(
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    generation          uuid        NOT NULL,
    indicateur_id       integer     NOT NULL
        REFERENCES public.indicateur_definition(id) ON DELETE CASCADE,
    collectivite_id     integer     NOT NULL
        REFERENCES public.collectivite(id) ON DELETE CASCADE,
    formule_attendue    text,
    created_at          timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_attempt_at     timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    failure_count       integer     NOT NULL DEFAULT 0
        CHECK (failure_count >= 0),
    last_failed_at      timestamptz,
    last_error          text,
    CONSTRAINT indicateur_reconciliation_formule_generation_unique
        UNIQUE (generation, indicateur_id, collectivite_id),
    CONSTRAINT indicateur_reconciliation_formule_normalisee_check
        CHECK (
            formule_attendue IS NULL
            OR (
                formule_attendue <> ''
                AND formule_attendue = lower(btrim(formule_attendue))
            )
        )
);

CREATE INDEX indicateur_reconciliation_formule_claim_idx
    ON private.indicateur_reconciliation_formule
        (next_attempt_at, failure_count, created_at,
         indicateur_id, collectivite_id, id);

CREATE INDEX indicateur_reconciliation_formule_target_idx
    ON private.indicateur_reconciliation_formule
        (indicateur_id, next_attempt_at, created_at, collectivite_id, id);

COMMENT ON TABLE private.indicateur_reconciliation_formule IS
    'File durable des recalculs de formules, revendiquée avec FOR UPDATE SKIP LOCKED et vidée transactionnellement.';
COMMENT ON COLUMN private.indicateur_reconciliation_formule.formule_attendue IS
    'Formule normalisée de la génération à réconcilier ; NULL représente explicitement le retrait de la formule.';

REVOKE ALL ON TABLE private.indicateur_reconciliation_formule
    FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
