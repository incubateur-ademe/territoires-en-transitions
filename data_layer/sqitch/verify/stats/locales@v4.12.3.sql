-- Verify tet:stats/locale on pg

BEGIN;

SELECT mois,
       code_region,
       code_departement,
       collectivites
FROM stats.locales_evolution_collectivite_avec_indicateur_referentiel
where false;

SELECT mois,
       code_region,
       code_departement,
       indicateurs
FROM stats.locales_evolution_resultat_indicateur_referentiel
where false;

SELECT mois,
       code_region,
       code_departement,
       collectivites
FROM stats_locales_evolution_collectivite_avec_indicateur
where false;

SELECT mois,
       code_region,
       code_departement,
       indicateurs
FROM stats_locales_evolution_resultat_indicateur_referentiel
where false;

ROLLBACK;
