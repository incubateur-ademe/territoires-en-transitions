-- Deploy tet:indicateur/referentiel to pg
-- requires: referentiel/contenu

BEGIN;

create or replace view indicateur_rempli(indicateur_id, perso_id, collectivite_id, rempli) as
SELECT i.indicateur_id,
       NULL::integer        AS perso_id,
       i.collectivite_id,
       count(i.valeur) > 0 AS rempli
FROM (select indicateur_id,
             collectivite_id,
             valeur
      from indicateur_resultat ir
      union all
      select indicateur_id,
             collectivite_id,
             valeur
      from indicateur_resultat_import) i
GROUP BY i.indicateur_id, i.collectivite_id
UNION ALL
SELECT alt.id               AS indicateur_id,
       NULL::integer        AS perso_id,
       i.collectivite_id,
       count(i.valeur) > 0 AS rempli
FROM (select indicateur_id,
             collectivite_id,
             valeur
      from indicateur_resultat ir
      union all
      select indicateur_id,
             collectivite_id,
             valeur
      from indicateur_resultat_import) i
         JOIN indicateur_definition alt ON alt.valeur_indicateur::text = i.indicateur_id::text
GROUP BY alt.id, i.collectivite_id
UNION ALL
SELECT NULL::character varying AS indicateur_id,
       ipr.indicateur_id       AS perso_id,
       ipr.collectivite_id,
       count(ipr.valeur) > 0   AS rempli
FROM indicateur_personnalise_resultat ipr
GROUP BY ipr.indicateur_id, ipr.collectivite_id;

COMMIT;
