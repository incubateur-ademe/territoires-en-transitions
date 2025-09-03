-- Revert tet:indicateurs/remove-view-indicateur-summary from pg

BEGIN;

CREATE VIEW public.indicateur_summary AS
SELECT c.id AS collectivite_id,
    ct.nom AS categorie,
    count(def.*) AS nombre,
    count(iv.*) AS rempli
   FROM collectivite c
     CROSS JOIN categorie_tag ct
     LEFT JOIN indicateur_categorie_tag ict ON ct.id = ict.categorie_tag_id
     LEFT JOIN indicateur_definition def ON ict.indicateur_id = def.id
     LEFT JOIN ( SELECT indicateur_valeur.indicateur_id,
            indicateur_valeur.collectivite_id
           FROM indicateur_valeur
          WHERE indicateur_valeur.resultat IS NOT NULL
          GROUP BY indicateur_valeur.indicateur_id, indicateur_valeur.collectivite_id) iv ON def.id = iv.indicateur_id AND c.id = iv.collectivite_id
  WHERE ct.collectivite_id IS NULL AND (ct.nom <> ALL (ARRAY['resultat'::text, 'impact'::text, 'prioritaire'::text])) AND def.collectivite_id IS NULL
  GROUP BY c.id, ct.id
UNION ALL
 SELECT perso.collectivite_id,
    'perso'::text AS categorie,
    count(perso.*) AS nombre,
    count(iv.*) AS rempli
   FROM indicateur_definition perso
     LEFT JOIN ( SELECT indicateur_valeur.indicateur_id,
            indicateur_valeur.collectivite_id
           FROM indicateur_valeur
          WHERE indicateur_valeur.resultat IS NOT NULL
          GROUP BY indicateur_valeur.indicateur_id, indicateur_valeur.collectivite_id) iv ON perso.id = iv.indicateur_id AND perso.collectivite_id = iv.collectivite_id
  WHERE perso.collectivite_id IS NOT NULL
  GROUP BY perso.collectivite_id;

COMMIT;
