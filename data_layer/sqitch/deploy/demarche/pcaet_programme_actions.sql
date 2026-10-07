-- Deploy tet:demarche/pcaet_programme_actions to pg
-- requires: demarche/pcaet_documents_amont

BEGIN;

-- Le décret nomme cette pièce le « programme d'actions ». « Plan d'actions »
-- entrait en plus en collision avec les plans d'action suivis sur la
-- plateforme, qui servent justement à la couvrir. L'identifiant ne bouge pas :
-- il est porté par le code et les tests.
UPDATE public.demarche_document_definition
SET nom         = 'Programme d''actions',
    modified_at = now()
WHERE id = 'pcaet_plan_actions';

COMMIT;
