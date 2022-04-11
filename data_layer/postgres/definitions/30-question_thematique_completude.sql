create type thematique_completude as enum ('complete', 'a_completer');

create or replace view question_thematique_completude as
with any_reponse as (
    select q.id                                                                 as question_id,
           q.thematique_id,

           coalesce(rb.collectivite_id, rp.collectivite_id, rc.collectivite_id) as collectivite_id
    from question q
             left join reponse_binaire rb on rb.question_id = q.id
             left join reponse_proportion rp on rp.question_id = q.id
             left join reponse_choix rc on rc.question_id = q.id
),
     reponse_thematique_count as (
         select ar.thematique_id, ar.collectivite_id, count(*) as count
         from any_reponse ar
         group by ar.thematique_id, ar.collectivite_id
     ),
     thematique_count as (
         select q.thematique_id,  count(*) as count
         from question q
                  join question_thematique qt on q.thematique_id = qt.id
         group by thematique_id, nom
     )
select c.id as collectivite_id,
       tc.thematique_id as id,
       qtd.nom,
       qtd.referentiels,
       case
           when rtc.count = tc.count
               then 'complete'::thematique_completude
           else 'a_completer'::thematique_completude
           end as completude
from collectivite c
         left join thematique_count tc on true
         left join reponse_thematique_count rtc on rtc.thematique_id = tc.thematique_id and rtc.collectivite_id = c.id
         left join question_thematique_display qtd on qtd.id = tc.thematique_id
;
