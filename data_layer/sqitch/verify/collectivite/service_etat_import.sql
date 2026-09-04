-- Verify tet:collectivite/service_etat_import on pg

BEGIN;

-- L'invariant est conditionnel, parce que le change l'est : il ne peuple que si
-- `collectivite` contient déjà quelque chose. Sur une base neuve — la CI, qui
-- déploie avant de charger le seed — la table est vide et il n'y a rien à
-- vérifier ; les services y arrivent ensuite par
-- `seed/imports/09-service_etat.sql`. Sur une base déjà peuplée, en revanche,
-- l'import doit être complet.
--
-- Des **minimums** par famille plutôt que des totaux exacts : un service ajouté
-- plus tard ne doit pas faire échouer un `verify` qui n'aurait rien à dire de
-- neuf. Le SIREN sert de marqueur de l'import — les services créés par les tests
-- n'en portent pas.
--
-- Deux témoins nommément vérifiés, un par mode d'appariement : une DDT (index
-- unique sur le département) et la DGEC (appariée sur le nom), avec leur couple
-- SIREN/NIC exact, ce qui attrape une ligne omise ou un identifiant erroné.

DO $$
DECLARE
    attendu record;
    obtenu integer;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM collectivite) THEN
        RETURN;
    END IF;

    FOR attendu IN
        SELECT * FROM (VALUES ('ddt', 92), ('dreal', 18), ('dr_ademe', 18), ('service_national', 2))
            AS v(famille, minimum)
    LOOP
        SELECT count(*) INTO obtenu
        FROM collectivite
        WHERE type = attendu.famille AND siren IS NOT NULL AND nic IS NOT NULL;

        IF obtenu < attendu.minimum THEN
            RAISE EXCEPTION
                '% : % services avec SIREN et NIC, au moins % attendus',
                attendu.famille, obtenu, attendu.minimum;
        END IF;
    END LOOP;

    IF NOT EXISTS (
        SELECT 1 FROM collectivite
        WHERE type = 'ddt' AND departement_code = '01'
          AND siren = '130009368' AND nic = '00015'
    ) THEN
        RAISE EXCEPTION 'la DDT de l''Ain n''a pas le SIRET attendu 13000936800015';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM collectivite
        WHERE type = 'service_national' AND siren = '120087010' AND nic = '00068'
    ) THEN
        RAISE EXCEPTION 'la DGEC n''a pas le SIRET attendu 12008701000068';
    END IF;
END $$;

ROLLBACK;
