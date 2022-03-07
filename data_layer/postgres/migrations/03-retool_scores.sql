alter table client_scores
    alter column scores
    set data type jsonb
    using scores::jsonb;
