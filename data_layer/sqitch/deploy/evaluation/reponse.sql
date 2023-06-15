-- Deploy tet:evaluation/reponse to pg
-- requires: referentiel/contenu
-- requires: collectivite/collectivite
-- requires: utils/auth
-- requires: utils/modified_at
-- requires: evaluation/question

BEGIN;

drop view reponse_display;

create view reponse_display
as
select r.collectivite_id,
       q.id                                    as question_id,
       json_build_object('question_id', q.id,
                         'collectivite_id', r.collectivite_id,
                         'type', q.type,
                         'reponse', r.reponse) as reponse,
       (select texte
        from justification j
        where j.collectivite_id = r.collectivite_id
          and j.question_id = r.question_id)   as justification
from reponse_binaire r
         join question q
              on r.question_id = q.id
where have_lecture_acces(collectivite_id)

union all

select r.collectivite_id,
       q.id                                    as question_id,
       json_build_object('question_id', q.id,
                         'collectivite_id', r.collectivite_id,
                         'type', q.type,
                         'reponse', r.reponse) as reponse,
       (select texte
        from justification j
        where j.collectivite_id = r.collectivite_id
          and j.question_id = r.question_id)   as justification
from reponse_proportion r
         join question q
              on r.question_id = q.id
where have_lecture_acces(collectivite_id)

union all

select r.collectivite_id,
       q.id                                    as question_id,
       json_build_object('question_id', q.id,
                         'collectivite_id', r.collectivite_id,
                         'type', q.type,
                         'reponse', r.reponse) as reponse,
       (select texte
        from justification j
        where j.collectivite_id = r.collectivite_id
          and j.question_id = r.question_id)   as justification
from reponse_choix r
         join question q
              on r.question_id = q.id
where have_lecture_acces(collectivite_id);

COMMIT;
