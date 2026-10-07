-- Deploy tet:demarche/pcaet_scot_aec to pg
-- requires: demarche/pcaet_depot_hors_plateforme

BEGIN;

-- Un SCoT-AEC est un Schéma de Cohérence Territoriale qui tient lieu de PCAET :
-- la collectivité dépose un document unique au lieu de deux. Rien ne le
-- distinguait jusqu'ici d'un PCAET classique, ni pour elle ni pour les services
-- de l'État qui l'instruisent.
--
-- La valeur est *déclarative* : la collectivité seule sait si son document est
-- fusionné. La compétence Banatic 5500 (SCOT) ne décide que d'une chose — si la
-- question lui est posée à l'étape 0 — et jamais de la réponse : porter un SCoT
-- n'implique pas d'y avoir fondu son PCAET.
ALTER TABLE public.demarche ADD COLUMN is_scot_aec boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.demarche.is_scot_aec IS
    'Déclaré par la collectivité à l''étape 0 : le PCAET est porté par un SCoT-AEC (document unique valant SCoT et PCAET). Purement déclaratif, n''ouvre aucun droit. La compétence Banatic 5500 conditionne l''affichage de la question, pas la valeur. Corrigeable tant que l''amont du dépôt est modifiable.';

-- Pas de backfill : les dépôts existants sont des PCAET classiques jusqu'à ce
-- que leur collectivité dise le contraire.

COMMIT;
