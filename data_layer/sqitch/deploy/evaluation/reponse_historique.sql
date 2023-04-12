-- Deploy tet:evaluation/reponse_history to pg
-- requires: evaluation/reponse
-- requires: history_schema

BEGIN;

create function
    historique.reponses_at(
    collectivite_id int,
    "time" timestamp with time zone
)
    returns table
            (
                question_id question_id,
                reponse     jsonb
            )
begin
    atomic
    with ranked_rb as (select *, rank() over (partition by rb.question_id order by modified_at desc ) as rank
                       from historique.reponse_binaire rb
                       where rb.collectivite_id = reponses_at.collectivite_id
                         and rb.modified_at <= reponses_at.time),
         ranked_rp as (select *, rank() over (partition by rp.question_id order by modified_at desc ) as rank
                       from historique.reponse_proportion rp
                       where rp.collectivite_id = reponses_at.collectivite_id
                         and rp.modified_at <= reponses_at.time),
         ranked_rc as (select *, rank() over (partition by rc.question_id order by modified_at desc ) as rank
                       from historique.reponse_choix rc
                       where rc.collectivite_id = reponses_at.collectivite_id
                         and rc.modified_at <= reponses_at.time)

    select q.id    as question_id,
           case
               when q.type = 'binaire'
                   then
                   case
                       when rb.reponse
                           then jsonb_build_object('id', q.id,
                                                   'value', 'OUI')
                       else
                           jsonb_build_object('id', q.id,
                                              'value', 'NON')
                       end
               when q.type = 'proportion'
                   then jsonb_build_object('id', q.id,
                                           'value', rp.reponse)
               when q.type = 'choix'
                   then jsonb_build_object('id', q.id,
                                           'value', rc.reponse)
               end as reponse
    from question q
             left join ranked_rb rb
                       on rb.question_id = q.id
                           and rank = 1
             left join ranked_rp rp
                       on rp.question_id = q.id
                           and rp.rank = 1
             left join ranked_rc rc
                       on rc.question_id = q.id
                           and rc.rank = 1
    where rb.reponse is not null
       or rp.reponse is not null
       or rc.reponse is not null;
end;
comment on function historique.reponses_at is
    'Les réponses d''une collectivité à un moment donné pour toutes les questions. '
        'Utilisée pour construire la payload envoyée au business.';

COMMIT;
