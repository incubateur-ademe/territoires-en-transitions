-- 1. insert scores

truncate score;

insert into score(collectivite_id, action_id, points, potentiel, referentiel_points, concerne, previsionnel,
                  total_taches_count, completed_taches_count)
values (1, 'cae_1.1.1.1.1', 50, 90, 100, true, 100, 0, 0);

insert into score(collectivite_id, action_id, points, potentiel, referentiel_points, concerne, previsionnel,
                  total_taches_count, completed_taches_count)
values (1, 'cae_2.1.1.1.3', 50, 90, 100, true, 100, 0, 0);


select * from score;

select * from client_scores;

delete from score where collectivite_id=1 and action_id= 'cae_1.1.1.1.1';

-- 2. check get_score_batches_for_epci
select *
from get_score_batches_for_epci(1);

-- 3. only 1 row should be returned  todo
select *
from client_scores
where collectivite_id = 1;

-- 4. there should be no client scores to compute.
select *
from should_create_client_scores_for_epci(1, '2021-01-01'::timestamptz);


