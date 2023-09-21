-- Deploy tet:evaluation/thematique_completude to pg
-- requires: evaluation/question

BEGIN;

create or replace view question_thematique_completude as
select c.id    as collectivite_id,
       qtd.id,
       qtd.nom,
       qtd.referentiels,
       case
           when private.reponse_count_by_thematique(c.id, qt.id) =
                private.question_count_for_thematique(c.id, qt.id)
               then 'complete'::thematique_completude
           else 'a_completer'::thematique_completude
           end as completude
from collectivite c
         left join question_thematique qt on true
         left join question_thematique_display qtd on qtd.id = qt.id
where referentiels is not null
  and est_verifie()
order by (case when qtd.id = 'identite' then '0' else qtd.nom end);

COMMIT;
