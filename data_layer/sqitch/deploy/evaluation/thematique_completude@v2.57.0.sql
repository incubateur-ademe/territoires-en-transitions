-- Deploy tet:evaluation/thematique_completude to pg
-- requires: evaluation/question

BEGIN;

comment on function private.question_count_for_thematique
    is 'Le nombre de questions applicables pour une collectivité sur une thématique.';


create function private.reponse_count_by_thematique(collectivite_id integer, thematique_id character varying) returns integer
    stable
    language sql
begin
    atomic
    select count(*)
    from question q
             left join reponse_binaire rb on rb.question_id = q.id
             left join reponse_proportion rp on rp.question_id = q.id
             left join reponse_choix rc on rc.question_id = q.id
    where rb.collectivite_id = reponse_count_by_thematique.collectivite_id
      and q.thematique_id = reponse_count_by_thematique.thematique_id;
end;
comment on function private.reponse_count_by_thematique
    is 'Le nombre de réponses d''une collectivités sur une question.';


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
