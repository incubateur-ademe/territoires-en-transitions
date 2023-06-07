-- Deploy tet:evaluation/reponse to pg
-- requires: referentiel/contenu
-- requires: collectivite/collectivite
-- requires: utils/auth
-- requires: utils/modified_at
-- requires: evaluation/question

BEGIN;

drop view reponse_display;
create view reponse_display as
with qr as (select q.id                         as question_id,
                   coalesce(rb.collectivite_id,
                            rp.collectivite_id,
                            rc.collectivite_id) as collectivite_id,
                   case
                       when q.type = 'binaire'
                           then json_build_object('question_id', q.id,
                                                  'collectivite_id', rb.collectivite_id,
                                                  'type', q.type,
                                                  'reponse', rb.reponse)
                       when q.type = 'proportion'
                           then json_build_object('question_id', q.id,
                                                  'collectivite_id', rp.collectivite_id,
                                                  'type', q.type,
                                                  'reponse', rp.reponse)
                       when q.type = 'choix'
                           then json_build_object('question_id', q.id,
                                                  'collectivite_id', rc.collectivite_id,
                                                  'type', q.type,
                                                  'reponse', rc.reponse)
                       end
                                                as reponse
            from question q
                     left join reponse_binaire rb on rb.question_id = q.id
                     left join reponse_proportion rp on rp.question_id = q.id
                     left join reponse_choix rc on rc.question_id = q.id
            where have_lecture_acces(coalesce(rb.collectivite_id,
                                              rp.collectivite_id,
                                              rc.collectivite_id)))
select collectivite_id,
       question_id,
       reponse                                       as reponse,
       (select texte
        from justification j
        where j.collectivite_id = qr.collectivite_id
          and j.question_id = qr.question_id
          and have_lecture_acces(j.collectivite_id)) as justification
from qr
where collectivite_id is not null;

COMMIT;
