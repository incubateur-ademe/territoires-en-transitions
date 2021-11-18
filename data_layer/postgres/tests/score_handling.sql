-- 1. insert scores
insert into score
values (default,
        1,
        'cae_1.2.3',
        0,
        10,
        10,
        true,
        10,
        10,
        7,
        '2021-01-01'::timestamptz);

-- 2. check get_score_batches_for_epci
select *
from get_score_batches_for_epci(1);

-- 3. only 1 row should be returned  todo
select *
from client_scores
where epci_id = 1;

-- 4. there should be no client scores to compute.
select *
from should_create_client_scores_for_epci(1, '2021-01-01'::timestamptz);


