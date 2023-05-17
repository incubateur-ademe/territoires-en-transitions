-- Deploy tet:evaluation/reponse to pg
-- requires: referentiel/contenu
-- requires: collectivite/collectivite
-- requires: utils/auth
-- requires: utils/modified_at
-- requires: evaluation/question

BEGIN;

drop view reponse_display;
create view reponse_display as
with qrj as (select q.id                        as question_id,
                    coalesce(rb.collectivite_id,
                             rp.collectivite_id,
                             rc.collectivite_id,
                             j.collectivite_id) as collectivite_id,
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
                                                as reponse,
                    j.texte                     as justification
             from question q
                      left join reponse_binaire rb on rb.question_id = q.id
                      left join reponse_proportion rp on rp.question_id = q.id
                      left join reponse_choix rc on rc.question_id = q.id
                      left join justification j on j.question_id = q.id
             where have_lecture_acces(coalesce(rb.collectivite_id,
                                               rp.collectivite_id,
                                               rc.collectivite_id,
                                               j.collectivite_id)))
select collectivite_id,
       question_id,
       (select qrj.reponse
        from qrj
        where qrj.collectivite_id = o.collectivite_id
          and qrj.question_id = o.question_id
          and qrj.reponse is not null)       as reponse,
       (select qrj.justification
        from qrj
        where qrj.collectivite_id = o.collectivite_id
          and qrj.question_id = o.question_id
          and qrj.justification is not null) as justification
from qrj o
where collectivite_id is not null
group by collectivite_id, question_id;

COMMIT;
