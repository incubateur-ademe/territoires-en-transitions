-- Deploy tet:evaluation/reponse_history to pg
-- requires: evaluation/reponse
-- requires: history_schema

BEGIN;

-- A temporary type to declare the composite array containing names and types
create type historique.question_reponse as
(
    type question_type,
    stored text
);

-- Instead of copying code, we execute a series of dynamic commands per reponse type.
-- https://www.postgresql.org/docs/14/plpgsql-statements.html#PLPGSQL-STATEMENTS-EXECUTING-DYN
do
$$
    declare
        a historique.question_reponse[];
        qr historique.question_reponse;
    begin
        a = array [('binaire', 'bool'), ('choix', 'choix_id'), ('proportion', 'float')];
        foreach qr in array a
            loop

-- create a table of named `reponse_type` that store a reponse of type `stored`
execute
'create table historique.reponse_' || qr.type
||' ('
||'     id               serial primary key,'
||'     collectivite_id  integer,'
||'     question_id      question_id,'
||'     reponse          ' || qr.stored || ','
||'     previous_reponse ' || qr.stored || ','
||'     modified_by      uuid,'
||'     modified_at      timestamp with time zone'
||' );';

-- enable rls for that table
execute
'alter table historique.reponse_' || qr.type || ' enable row level security;';

-- create a function named `save_reponse_type`.
execute
'create function historique.save_reponse_' || qr.type || '()'
||' returns trigger'
||' as'
||' $string$'
||' declare'
||'     updated integer;'
||' begin'
--- try to update before inserting to debounce.
||' update historique.reponse_' || qr.type
||' set reponse = new.reponse,'
||'     modified_at = new.modified_at'
||' where id in (select id'
||'              from historique.reponse_' || qr.type
||'              where collectivite_id = new.collectivite_id'
||'                and question_id = new.question_id'
||'                and modified_by = auth.uid()'
||'                and modified_at > new.modified_at - interval ''1 hour'''
||'              order by modified_by desc'
||'              limit 1)'
||' returning id into updated;'
--- if nothing was updated, insert.
||' if updated is null'
||' then'
||' insert into historique.reponse_' || qr.type
||'    (collectivite_id, question_id, reponse, previous_reponse, modified_by, modified_at)'
||' values (new.collectivite_id,'
||'         new.question_id,'
||'         new.reponse,'
||'         old.reponse,'
||'         auth.uid(),'
||'         new.modified_at);'
||' end if;'
||' return new;'
||' end;'
||' $string$ language plpgsql security definer;';

-- create a trigger on the existing public table `reponse_type`
execute
'create trigger save_history'
||'     after insert or update'
||'     on reponse_' || qr.type
||'     for each row'
||' execute procedure historique.save_reponse_' || qr.type || '();';

-- create an intermediary display view that compute previous values.
execute
'create view historique.reponse_' || qr.type || '_display'
||' as'
||' select collectivite_id,'
||'        question_id,'
||'        reponse,'
||'        lag(reponse) over w as  previous_reponse,'
||'        modified_at,'
||'        lag(modified_at) over w previous_modified_at,'
||'        modified_by,'
||'        lag(modified_by) over w previous_modified_by'
||' from historique.reponse_' || qr.type
||'     window w as ('
||'         partition by collectivite_id, question_id'
||'         order by modified_at'
||'         rows between 1 preceding and current row )'
||' order by collectivite_id,'
||'          question_id,'
||'          modified_at desc;';

            end loop;
    end ;
$$;

-- We don't need the type anymore.
drop type historique.question_reponse;

-- Fuse all response types using json values.
create view historique.reponse_display
as
select 'binaire' :: question_type  as question_type,
       collectivite_id,
       question_id,
       to_jsonb(reponse)           as reponse,
       to_jsonb(previous_reponse)  as previous_reponse,
       modified_at,
       previous_modified_at,
       modified_by,
       previous_modified_by
from historique.reponse_binaire_display
union all
select 'choix' :: question_type,
       collectivite_id,
       r.question_id,
       to_jsonb((select qc.formulation
                from question_choix qc
                where qc.id = reponse)),
       to_jsonb((select qc.formulation
                from question_choix qc
                where qc.id = previous_reponse)),
       modified_at,
       previous_modified_at,
       modified_by,
       previous_modified_by
from historique.reponse_choix_display r

union all
select 'proportion' :: question_type,
       collectivite_id,
       question_id,
       to_jsonb(reponse),
       to_jsonb(previous_reponse),
       modified_at,
       previous_modified_at,
       modified_by,
       previous_modified_by
from historique.reponse_proportion_display
order by collectivite_id,
         question_id,
         modified_at desc;


COMMIT;
