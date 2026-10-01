-- Verify tet:indicateur/margny_indicateurs_mensuels on pg
BEGIN;
DO $$
BEGIN
    ASSERT NOT EXISTS (SELECT FROM public.indicateur_definition
        WHERE collectivite_id = 2181 AND id IN (31816, 32392) AND periodicite <> 'mensuelle'),
        'Les deux indicateurs de Margny doivent être mensuels';
    ASSERT NOT EXISTS (SELECT FROM public.indicateur_valeur
        WHERE collectivite_id = 2181 AND indicateur_id IN (31816, 32392)
          AND (periodicite <> 'mensuelle'
               OR date_valeur <> public.indicateur_date_debut_periode(periodicite, date_valeur))),
        'Les observations de Margny doivent être rattachées au début de leur mois';
END $$;
ROLLBACK;
