-- Deploy tet:indicateur/dependances_formules to pg
-- requires: private_schema

BEGIN;

-- La grammaire applicative interdit chaînes et commentaires. Un identifiant
-- est [a-zA-Z_][a-zA-Z_0-9.-]* et les quatre appels ci-dessous sont les seuls
-- qui référencent un indicateur. Cette extraction ne prétend pas valider
-- l'expression complète : elle projette exhaustivement les références de
-- toute formule acceptée par le parseur applicatif.
--
-- La fonction appartient à l'expand : le préflight et le contract partagent
-- ainsi exactement le même parseur de dépendances, sans dupliquer sa regex.
CREATE FUNCTION private.extraire_dependances_formule_indicateur(formule text)
    RETURNS TABLE (source_identifiant text)
    LANGUAGE sql
    IMMUTABLE
    STRICT
    PARALLEL SAFE
    SET search_path = pg_catalog
AS $$
    SELECT DISTINCT lower(captures[3])
    FROM regexp_matches(
        formule,
        '(^|[^[:alnum:]_.-])(opt_val|val|cible|limite)[[:space:]]*[(][[:space:]]*([[:alpha:]_][[:alnum:]_.-]*)',
        'g'
    ) AS captures;
$$;

COMMENT ON FUNCTION private.extraire_dependances_formule_indicateur(text) IS
    'Extrait les identifiants référencés par une formule indicateur acceptée par la grammaire applicative.';

REVOKE EXECUTE
    ON FUNCTION private.extraire_dependances_formule_indicateur(text)
    FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
