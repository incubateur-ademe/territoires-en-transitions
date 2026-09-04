-- Verify tet:collectivite/service_etat_import on pg

BEGIN;

-- L'invariant est conditionnel, parce que le change l'est : il ne peuple que si
-- `collectivite` contient déjà quelque chose. Sur une base neuve — la CI, qui
-- déploie avec `--verify` avant de charger le seed — la table est vide et il n'y
-- a rien à vérifier ; les services y arrivent ensuite par
-- `seed/imports/09-service_etat.sql`. Sur une base déjà peuplée, en revanche, les
-- services doivent être là.
--
-- Deux témoins suffisent, un par mode d'appariement : une DDT (index unique sur
-- le département, SIREN propre) et un service national (apparié sur le nom,
-- SIREN et NIC issus d'un SIRET). Pas de comptage exact : un service ajouté plus
-- tard ferait échouer un `verify` qui n'aurait rien à dire de neuf.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM collectivite) THEN
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM collectivite
        WHERE type = 'ddt' AND departement_code = '01'
          AND siren = '130009368' AND nic IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'la DDT de l''Ain est absente ou sans SIREN';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM collectivite
        WHERE type = 'service_national'
          AND siren = '120087010' AND nic = '00068'
    ) THEN
        RAISE EXCEPTION 'la DGEC est absente ou sans SIRET';
    END IF;
END $$;

ROLLBACK;
