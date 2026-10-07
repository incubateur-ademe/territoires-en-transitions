-- Verify tet:collectivite/perimetre_secondaire on pg

BEGIN;

-- La table et ses garde-fous existent, quel que soit l'état des données.
SELECT id, collectivite_id, region_code, departement_code, source, created_at
FROM public.collectivite_perimetre_secondaire
WHERE false;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'collectivite_perimetre_secondaire_un_seul_code'
    ) THEN
        RAISE EXCEPTION 'la contrainte « un seul code » manque';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'collectivite_perimetre_secondaire_source_connue'
    ) THEN
        RAISE EXCEPTION 'la contrainte sur `source` manque';
    END IF;

    IF has_table_privilege('anon', 'public.collectivite_perimetre_secondaire', 'SELECT')
    THEN
        RAISE EXCEPTION 'anon peut lire collectivite_perimetre_secondaire';
    END IF;

    IF has_table_privilege('authenticated', 'public.collectivite_perimetre_secondaire', 'SELECT')
    THEN
        RAISE EXCEPTION 'authenticated peut lire collectivite_perimetre_secondaire';
    END IF;
END $$;

-- L'invariant des données est conditionnel, comme le change qui les pose : sur
-- une base neuve — la CI, qui déploie avant de charger le seed — `collectivite`
-- est vide et il n'y a rien à vérifier. Sur une base déjà peuplée, en revanche,
-- le repli doit avoir eu lieu.
DO $$
DECLARE
    dedoubles integer;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM collectivite) THEN
        RETURN;
    END IF;

    -- Un SIRET désigne un service et un seul : c'est ce qui rend le
    -- rattachement automatique par ProConnect capable de trancher.
    SELECT count(*) INTO dedoubles
    FROM (
        SELECT siren, nic
        FROM collectivite
        WHERE type = 'dr_ademe' AND siren IS NOT NULL AND nic IS NOT NULL
        GROUP BY siren, nic
        HAVING count(*) > 1
    ) AS doublons;

    IF dedoubles > 0 THEN
        RAISE EXCEPTION '% SIRET de DR ADEME portés par plusieurs lignes', dedoubles;
    END IF;

    -- Le témoin : la DR ADEME Océan Indien couvre deux régions, l'une en
    -- principal et l'autre ici.
    IF NOT EXISTS (
        SELECT 1
        FROM collectivite AS c
        JOIN collectivite_perimetre_secondaire AS p ON p.collectivite_id = c.id
        WHERE c.type = 'dr_ademe'
          AND c.siren = '385290309'
          AND c.nic = '00397'
          AND p.region_code IS NOT NULL
          AND p.source = 'import_service_etat'
    ) THEN
        RAISE EXCEPTION 'la DR ADEME Océan Indien n''a pas de région secondaire';
    END IF;
END $$;

ROLLBACK;
