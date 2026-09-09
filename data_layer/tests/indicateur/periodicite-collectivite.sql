BEGIN;
SELECT plan(17);

CREATE TEMP TABLE policy_collectivites AS
WITH inserted AS (
    INSERT INTO public.collectivite (nom, type)
    VALUES ('Suivi mensuel', 'epci'), ('Suivi annuel', 'epci')
    RETURNING id, nom
) SELECT * FROM inserted;

CREATE TEMP TABLE policy_indicateurs AS
WITH inserted AS (
    INSERT INTO public.indicateur_definition (titre, unite, periodicite, periodicite_mode)
    VALUES ('Recommandé', 'kWh', 'annuelle', 'recommandee'),
           ('Imposé', 'kWh', 'annuelle', 'imposee')
    RETURNING id, periodicite_mode
) SELECT * FROM inserted;

CREATE TEMP TABLE policy_scope AS
SELECT c.id AS collectivite_id, i.id AS indicateur_id
FROM policy_collectivites c CROSS JOIN policy_indicateurs i
WHERE c.nom = 'Suivi mensuel' AND i.periodicite_mode = 'recommandee';

SELECT is((SELECT periodicite_mode FROM public.indicateur_definition
           WHERE id = (SELECT indicateur_id FROM policy_scope)), 'recommandee',
          'Le catalogue expose une recommandation');
SELECT is((SELECT periodicite FROM public.indicateur_definition
           WHERE id = (SELECT indicateur_id FROM policy_scope)), 'annuelle',
          'La recommandation du catalogue est annuelle');

INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, date_valeur, resultat)
SELECT collectivite_id, indicateur_id, DATE '2026-01-01', 120 FROM policy_scope;

SELECT lives_ok($$
    INSERT INTO public.indicateur_collectivite (collectivite_id, indicateur_id, periodicite)
    SELECT collectivite_id, indicateur_id, 'mensuelle' FROM policy_scope
$$, 'La collectivité peut choisir un suivi mensuel malgré son historique annuel');

SELECT is((SELECT periodicite FROM public.indicateur_definition
           WHERE id = (SELECT indicateur_id FROM policy_scope)), 'annuelle',
          'Le choix local ne modifie pas le catalogue');
SELECT is((SELECT count(*) FROM public.indicateur_collectivite
           WHERE collectivite_id = (SELECT id FROM policy_collectivites WHERE nom = 'Suivi annuel')),
          0::bigint, 'Le choix local ne crée pas de préférence pour une autre collectivité');
SELECT is((SELECT resultat FROM public.indicateur_valeur
           WHERE indicateur_id = (SELECT indicateur_id FROM policy_scope) AND periodicite = 'annuelle'),
          120::double precision, 'La valeur annuelle reste annuelle');

SELECT lives_ok($$
    INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, periodicite, date_valeur, resultat)
    SELECT collectivite_id, indicateur_id, 'mensuelle', DATE '2026-01-01', 10 FROM policy_scope
$$, 'Janvier peut coexister avec la valeur annuelle de la même année');
SELECT is((SELECT count(*) FROM public.indicateur_valeur
           WHERE indicateur_id = (SELECT indicateur_id FROM policy_scope)),
          2::bigint, 'Les deux séries conservent leur propre valeur');

SELECT throws_ok($$
    UPDATE public.indicateur_valeur SET periodicite = 'mensuelle'
    WHERE indicateur_id = (SELECT indicateur_id FROM policy_scope) AND periodicite = 'annuelle'
$$, '23514', 'La périodicité d''une valeur enregistrée est immuable',
    'Une valeur ne peut pas être réinterprétée');

SELECT throws_ok($$
    INSERT INTO public.indicateur_collectivite (collectivite_id, indicateur_id, periodicite)
    SELECT (SELECT collectivite_id FROM policy_scope), id, 'mensuelle'
    FROM policy_indicateurs WHERE periodicite_mode = 'imposee'
$$, '23514', 'La périodicité imposée ne peut pas être personnalisée',
    'La base interdit la personnalisation d''un indicateur imposé');

SELECT throws_ok($$
    INSERT INTO public.indicateur_valeur (collectivite_id, indicateur_id, periodicite, date_valeur, resultat)
    SELECT (SELECT collectivite_id FROM policy_scope), id, 'mensuelle', DATE '2026-02-01', 10
    FROM policy_indicateurs WHERE periodicite_mode = 'imposee'
$$, '23514', 'La valeur doit respecter la périodicité imposée',
    'Une écriture directe ne contourne pas la périodicité imposée');

SELECT throws_ok($$
    UPDATE public.indicateur_definition SET periodicite_mode = 'imposee'
    WHERE id = (SELECT indicateur_id FROM policy_scope)
$$, '23514', 'Des préférences ou séries existantes empêchent d''imposer cette périodicité',
    'Le catalogue ne peut pas invalider silencieusement un suivi local');

SELECT lives_ok($$
    UPDATE public.indicateur_collectivite SET periodicite = NULL
    WHERE (collectivite_id, indicateur_id) = (SELECT collectivite_id, indicateur_id FROM policy_scope)
$$, 'Le retour à la recommandation est possible');
SELECT is((SELECT count(*) FROM public.indicateur_valeur
           WHERE indicateur_id = (SELECT indicateur_id FROM policy_scope)),
          2::bigint, 'Revenir au suivi annuel conserve aussi les valeurs mensuelles');
SELECT is((SELECT resultat FROM public.indicateur_valeur
           WHERE indicateur_id = (SELECT indicateur_id FROM policy_scope) AND periodicite = 'annuelle'),
          120::double precision, 'Aucune conversion ou agrégation implicite');

-- Simulate an authenticated REST caller, including when RLS grants access to a
-- personal definition: neither its mode nor its imposed cadence is writable.
SET LOCAL request.jwt.claim.role = 'authenticated';
SELECT throws_ok($$
    UPDATE public.indicateur_definition SET periodicite_mode = 'recommandee'
    WHERE id = (SELECT id FROM policy_indicateurs WHERE periodicite_mode = 'imposee')
$$, '42501', 'Seule l''administration du catalogue peut modifier une périodicité imposée ou son mode',
    'Une collectivité ne peut pas retirer le mode imposé');
SELECT throws_ok($$
    UPDATE public.indicateur_definition SET periodicite = 'mensuelle'
    WHERE id = (SELECT id FROM policy_indicateurs WHERE periodicite_mode = 'imposee')
$$, '42501', 'Seule l''administration du catalogue peut modifier une périodicité imposée ou son mode',
    'Une collectivité ne peut pas modifier directement une cadence imposée');

SELECT * FROM finish();
ROLLBACK;
