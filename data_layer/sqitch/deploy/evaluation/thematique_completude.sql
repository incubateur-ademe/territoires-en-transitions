-- Deploy tet:evaluation/thematique_completude to pg
-- requires: evaluation/question

BEGIN;

create or replace function private.reponse_count_by_thematique(collectivite_id integer, thematique_id character varying) returns integer
    stable
    language sql
begin
    atomic
    select (count(rb) + count(rp) + count(rc)) as count
    from question q
             left join reponse_binaire rb
                       on rb.question_id = q.id
                           and rb.collectivite_id = reponse_count_by_thematique.collectivite_id
             left join reponse_proportion rp
                       on rp.question_id = q.id
                           and rp.collectivite_id = reponse_count_by_thematique.collectivite_id
             left join reponse_choix rc
                       on rc.question_id = q.id
                           and rc.collectivite_id = reponse_count_by_thematique.collectivite_id
    where q.thematique_id = reponse_count_by_thematique.thematique_id;
end;

COMMIT;
