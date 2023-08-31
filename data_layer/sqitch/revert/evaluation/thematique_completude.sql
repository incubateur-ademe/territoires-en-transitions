-- Deploy tet:evaluation/thematique_completude to pg
-- requires: evaluation/question

BEGIN;

create or replace view question_thematique_completude(collectivite_id, id, nom, referentiels, completude) as
WITH any_reponse AS (SELECT q.id                                                                 AS question_id,
                            q.thematique_id,
                            COALESCE(rb.collectivite_id, rp.collectivite_id, rc.collectivite_id) AS collectivite_id
                     FROM question q
                              LEFT JOIN reponse_binaire rb ON rb.question_id::text = q.id::text
                              LEFT JOIN reponse_proportion rp ON rp.question_id::text = q.id::text
                              LEFT JOIN reponse_choix rc ON rc.question_id::text = q.id::text),
     reponse_thematique_count AS (SELECT ar.thematique_id,
                                         ar.collectivite_id,
                                         count(*) AS count
                                  FROM any_reponse ar
                                  GROUP BY ar.thematique_id, ar.collectivite_id)
SELECT c.id    AS collectivite_id,
       qtd.id,
       qtd.nom,
       qtd.referentiels,
       CASE
           WHEN rtc.count = private.question_count_for_thematique(c.id, rtc.thematique_id) THEN 'complete'::thematique_completude
           ELSE 'a_completer'::thematique_completude
           END AS completude
FROM collectivite c
         LEFT JOIN question_thematique qt ON true
         LEFT JOIN reponse_thematique_count rtc ON rtc.thematique_id::text = qt.id::text AND rtc.collectivite_id = c.id
         LEFT JOIN question_thematique_display qtd ON qtd.id::text = qt.id::text
WHERE qtd.referentiels IS NOT NULL
  and est_verifie()
ORDER BY (CASE
              WHEN qtd.id::text = 'identite'::text THEN '0'::text
              ELSE qtd.nom END);

drop function private.reponse_count_by_thematique;

COMMIT;
