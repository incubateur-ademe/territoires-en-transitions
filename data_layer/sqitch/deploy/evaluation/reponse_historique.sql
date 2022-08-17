-- Deploy tet:evaluation/reponse_history to pg
-- requires: evaluation/reponse
-- requires: history_schema

BEGIN;

--- Tous les éléments sont les mêmes pour les 3 types de réponses
--- on aurait pu faire moins de copier/coller grace à un EXECUTE
--- au détriment de la lisibilité.

-- Réponse choix
create table historique.reponse_choix
(
    collectivite_id  integer,
    question_id      question_id,
    reponse          choix_id,
    previous_reponse choix_id,
    modified_by      uuid,
    modified_at      timestamp with time zone
);
alter table historique.reponse_choix
    enable row level security;
create function historique.save_reponse_choix() returns trigger
as
$$
begin
    insert into historique.reponse_choix
    values (new.collectivite_id,
            new.question_id,
            new.reponse,
            old.reponse,
            auth.uid(),
            now());
    return new;
end;
$$ language plpgsql security definer;

create trigger save_history
    after insert or update
    on reponse_choix
    for each row
execute procedure historique.save_reponse_choix();

create view historique.reponse_choix_display
as
select collectivite_id,
       question_id,
       reponse,
       lag(reponse) over w as  previous_reponse,
       modified_at,
       lag(modified_at) over w previous_modified_at,
       modified_by,
       lag(modified_by) over w previous_modified_by
from historique.reponse_choix
    window w as (
        partition by collectivite_id, question_id
        order by modified_at
        rows between 1 preceding and current row )
order by collectivite_id,
         question_id,
         modified_at desc;


-- Réponse proportion
create table historique.reponse_proportion
(
    collectivite_id  integer,
    question_id      question_id,
    reponse          float,
    previous_reponse float,
    modified_by      uuid,
    modified_at      timestamp with time zone
);
alter table historique.reponse_proportion
    enable row level security;
create function historique.save_reponse_proportion() returns trigger
as
$$
begin
    insert into historique.reponse_proportion
    values (new.collectivite_id,
            new.question_id,
            new.reponse,
            old.reponse,
            auth.uid(),
            now());
    return new;
end;
$$ language plpgsql security definer;

create trigger save_history
    after insert or update
    on reponse_proportion
    for each row
execute procedure historique.save_reponse_proportion();

create view historique.reponse_proportion_display
as
select collectivite_id,
       question_id,
       reponse,
       lag(reponse) over w as  previous_reponse,
       modified_at,
       lag(modified_at) over w previous_modified_at,
       modified_by,
       lag(modified_by) over w previous_modified_by
from historique.reponse_proportion
    window w as (
        partition by collectivite_id, question_id
        order by modified_at
        rows between 1 preceding and current row )
order by collectivite_id,
         question_id,
         modified_at desc;


-- Réponse binaire
create table historique.reponse_binaire
(
    collectivite_id  integer,
    question_id      question_id,
    reponse          bool,
    previous_reponse bool,
    modified_by      uuid,
    modified_at      timestamp with time zone
);
alter table historique.reponse_binaire
    enable row level security;
create function historique.save_reponse_binaire() returns trigger
as
$$
begin
    insert into historique.reponse_binaire
    values (new.collectivite_id,
            new.question_id,
            new.reponse,
            old.reponse,
            auth.uid(),
            now());
    return new;
end;
$$ language plpgsql security definer;

create trigger save_history
    after insert or update
    on reponse_binaire
    for each row
execute procedure historique.save_reponse_binaire();

create view historique.reponse_binaire_display
as
select collectivite_id,
       question_id,
       reponse,
       lag(reponse) over w as  previous_reponse,
       modified_at,
       lag(modified_at) over w previous_modified_at,
       modified_by,
       lag(modified_by) over w previous_modified_by
from historique.reponse_binaire
    window w as (
        partition by collectivite_id, question_id
        order by modified_at
        rows between 1 preceding and current row )
order by collectivite_id,
         question_id,
         modified_at desc;


create view historique.reponse_display
as
select 'binaire' :: question_type as question_type,
       collectivite_id,
       question_id,
       to_json(reponse)           as reponse,
       to_json(previous_reponse)  as previous_reponse,
       modified_at,
       previous_modified_at,
       modified_by,
       previous_modified_by
from historique.reponse_binaire_display
union all
select 'choix' :: question_type,
       collectivite_id,
       question_id,
       to_json(reponse),
       to_json(previous_reponse),
       modified_at,
       previous_modified_at,
       modified_by,
       previous_modified_by
from historique.reponse_choix_display
union all
select 'proportion' :: question_type,
       collectivite_id,
       question_id,
       to_json(reponse),
       to_json(previous_reponse),
       modified_at,
       previous_modified_at,
       modified_by,
       previous_modified_by
from historique.reponse_proportion_display
order by collectivite_id,
         question_id,
         modified_at desc;

COMMIT;
