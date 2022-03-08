drop view retool_score;

alter table client_scores
    alter column scores
    set data type jsonb
    using scores::jsonb;

-- then execute 21 retool
