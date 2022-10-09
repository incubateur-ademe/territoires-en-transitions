-- Deploy tet:export/fonctions to pg

BEGIN;

create or replace function
    export.identite(collectivite_id int)
    returns jsonb
as
$$
select jsonb_build_object(
               'nom', nom,
               'type', type_collectivite,
               'siren_insee', code_siren_insee,
               'population', population,
               'region', region_code,
               'departement', departement_code,
               'etoiles_eci', etoiles_eci,
               'completude_eci', completude_eci,
               'etoiles_cae', etoiles_cae,
               'completude_cae', completude_cae
           )
from collectivite_card cc
where cc.collectivite_id = identite.collectivite_id
$$ language sql stable;


create or replace function
    export.contacts(collectivite_id int)
    returns jsonb
as
$$
select jsonb_agg(dcp)
from private_utilisateur_droit pud
         join utilisateur.dcp_display dcp on pud.user_id = dcp.user_id
where pud.active = true
  and pud.collectivite_id = contacts.collectivite_id
$$ language sql stable;


create or replace function
    export.questions(collectivite_id int)
    returns jsonb
as
$$
with question as (select case
                             when q.type = 'binaire'::question_type then jsonb_build_object('question_id', q.id, 'type',
                                                                                            q.type, 'reponse',
                                                                                            rb.reponse)
                             when q.type = 'proportion'::question_type then jsonb_build_object('question_id', q.id,
                                                                                               'type', q.type,
                                                                                               'reponse', rp.reponse)
                             when q.type = 'choix'::question_type then jsonb_build_object('question_id', q.id, 'type',
                                                                                          q.type, 'reponse',
                                                                                          qc.formulation)
                             else null::jsonb
                             end as reponse
                  from question q
                           left join reponse_binaire rb on rb.question_id::text = q.id::text and
                                                           rb.collectivite_id = questions.collectivite_id
                           left join reponse_proportion rp on rp.question_id::text = q.id::text and
                                                              rp.collectivite_id = questions.collectivite_id
                           left join reponse_choix rc on rc.question_id::text = q.id::text and
                                                         rc.collectivite_id = questions.collectivite_id
                           left join question_choix qc on rc.reponse = qc.id)


select jsonb_agg(q.reponse order by q.reponse ->> 'question_id')
from question q
$$ language sql stable;


create or replace function
    export.scores(collectivite_id int, referentiel referentiel)
    returns jsonb
as
$$
select jsonb_agg(s order by naturalsort(s.action_id)) as scores
from private.action_scores s
where s.referentiel = scores.referentiel
  and s.collectivite_id = scores.collectivite_id
$$ language sql stable;

COMMIT;
