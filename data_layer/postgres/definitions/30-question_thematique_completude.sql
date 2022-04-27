create type thematique_completude as enum ('complete', 'a_completer');

create or replace function
    private.question_count_for_thematique(collectivite_id integer, thematique_id varchar)
    returns integer
as
$$
select count(*)
from collectivite c
         join question q on q.types_collectivites_concernees @> private.collectivite_type(c.id) or
                            types_collectivites_concernees is null
         join question_thematique qt on q.thematique_id = qt.id
where c.id = question_count_for_thematique.collectivite_id
  and qt.id = question_count_for_thematique.thematique_id
$$ language sql stable;
comment on function private.question_count_for_thematique is
    'Renvoie une le nombre de questions pour une thématique applicable à une collectivité.';


create or replace view question_thematique_completude as
with
    -- coalesce réponses types by collectivité for a thématique.
    any_reponse as (select q.id                                                                 as question_id,
                           q.thematique_id,
                           coalesce(rb.collectivite_id, rp.collectivite_id, rc.collectivite_id) as collectivite_id
                    from question q
                             left join reponse_binaire rb on rb.question_id = q.id
                             left join reponse_proportion rp on rp.question_id = q.id
                             left join reponse_choix rc on rc.question_id = q.id),
    -- count collectivité réponses per thématique.
    reponse_thematique_count as (select ar.thematique_id, ar.collectivite_id, count(*) as count
                                 from any_reponse ar
                                 group by ar.thematique_id, ar.collectivite_id)
select c.id    as collectivite_id,
       qtd.id ,
       qtd.nom,
       qtd.referentiels,
       case
           when rtc.count = private.question_count_for_thematique(c.id, rtc.thematique_id)
               then 'complete'::thematique_completude
           else 'a_completer'::thematique_completude
           end as completude
from collectivite c
         left join question_thematique qt on true
         left join reponse_thematique_count rtc on rtc.thematique_id = qt.id and rtc.collectivite_id = c.id
         left join question_thematique_display qtd on qtd.id = qt.id
where referentiels is not null
order by c.id,
         (case when rtc.thematique_id = 'identite' then '0' else qtd.nom end);
