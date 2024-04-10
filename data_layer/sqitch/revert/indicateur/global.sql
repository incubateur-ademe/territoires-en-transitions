-- Revert tet:indicateur/global from pg

BEGIN;

create or replace view indicateurs
            (type, collectivite_id, indicateur_id, indicateur_perso_id, annee, valeur, commentaire, source,
             source_id) as
SELECT 'resultat'::indicateur_valeur_type AS type,
       r.collectivite_id,
       r.indicateur_id,
       NULL::integer                      AS indicateur_perso_id,
       r.annee,
       r.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_resultat r
JOIN indicateur_definition d ON r.indicateur_id::text = d.id::text
LEFT JOIN indicateur_resultat_commentaire c
          ON r.indicateur_id::text = c.indicateur_id::text AND r.collectivite_id = c.collectivite_id AND
             r.annee = c.annee
UNION ALL
SELECT 'resultat'::indicateur_valeur_type AS type,
       r.collectivite_id,
       alt.id                             AS indicateur_id,
       NULL::integer                      AS indicateur_perso_id,
       r.annee,
       r.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_resultat r
JOIN indicateur_definition alt ON r.indicateur_id::text = alt.valeur_indicateur::text
LEFT JOIN indicateur_confidentiel confidentiel ON r.indicateur_id::text = confidentiel.indicateur_id AND
                                                  r.collectivite_id = confidentiel.collectivite_id
LEFT JOIN indicateur_resultat_commentaire c
          ON r.indicateur_id::text = c.indicateur_id::text AND r.collectivite_id = c.collectivite_id AND
             r.annee = c.annee
UNION ALL
SELECT 'objectif'::indicateur_valeur_type AS type,
       o.collectivite_id,
       d.id                               AS indicateur_id,
       NULL::integer                      AS indicateur_perso_id,
       o.annee,
       o.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_objectif o
JOIN indicateur_definition d ON o.indicateur_id::text = d.id::text
LEFT JOIN indicateur_objectif_commentaire c
          ON o.indicateur_id::text = c.indicateur_id::text AND o.collectivite_id = c.collectivite_id AND
             o.annee = c.annee
UNION ALL
SELECT 'objectif'::indicateur_valeur_type AS type,
       o.collectivite_id,
       alt.id                             AS indicateur_id,
       NULL::integer                      AS indicateur_perso_id,
       o.annee,
       o.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_objectif o
JOIN indicateur_definition alt ON o.indicateur_id::text = alt.valeur_indicateur::text
LEFT JOIN indicateur_objectif_commentaire c
          ON o.indicateur_id::text = c.indicateur_id::text AND o.collectivite_id = c.collectivite_id AND
             o.annee = c.annee
UNION ALL
SELECT 'import'::indicateur_valeur_type AS type,
       indicateur_resultat_import.collectivite_id,
       indicateur_resultat_import.indicateur_id,
       NULL::integer                    AS indicateur_perso_id,
       indicateur_resultat_import.annee,
       indicateur_resultat_import.valeur,
       NULL::text                       AS commentaire,
       indicateur_resultat_import.source,
       indicateur_resultat_import.source_id
FROM indicateur_resultat_import
UNION ALL
SELECT 'import'::indicateur_valeur_type AS type,
       i.collectivite_id,
       alt.id                           AS indicateur_id,
       NULL::integer                    AS indicateur_perso_id,
       i.annee,
       i.valeur,
       NULL::text                       AS commentaire,
       i.source,
       i.source_id
FROM indicateur_resultat_import i
JOIN indicateur_definition alt ON i.indicateur_id::text = alt.valeur_indicateur::text
UNION ALL
SELECT 'resultat'::indicateur_valeur_type AS type,
       r.collectivite_id,
       NULL::character varying            AS indicateur_id,
       r.indicateur_id                    AS indicateur_perso_id,
       r.annee,
       r.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_personnalise_resultat r
LEFT JOIN indicateur_perso_resultat_commentaire c USING (collectivite_id, indicateur_id, annee)
UNION ALL
SELECT 'objectif'::indicateur_valeur_type AS type,
       r.collectivite_id,
       NULL::character varying            AS indicateur_id,
       r.indicateur_id                    AS indicateur_perso_id,
       r.annee,
       r.valeur,
       c.commentaire,
       NULL::text                         AS source,
       NULL::text                         AS source_id
FROM indicateur_personnalise_objectif r
LEFT JOIN indicateur_perso_objectif_commentaire c USING (collectivite_id, indicateur_id, annee);

COMMIT;
