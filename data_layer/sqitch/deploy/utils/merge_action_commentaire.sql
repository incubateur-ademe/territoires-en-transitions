-- Deploy tet:utils/merge_action_commentaire to pg

BEGIN;

create function
    private.merge_action_commentaire(a action_id, b action_id)
    returns void
as
$$
with 
commentaire_1 as (select * from action_commentaire where action_id = a ),
commentaire_2 as (select * from action_commentaire where action_id = b ),
merged as
(
select commentaire_1.collectivite_id, 
case when commentaire_1.commentaire != commentaire_2.commentaire then concat(commentaire_1.commentaire, ' ', commentaire_2.commentaire) else commentaire_1.commentaire end as new_commentaire_1
from commentaire_1 left join commentaire_2 on commentaire_1.collectivite_id = commentaire_2.collectivite_id)
update action_commentaire 
set commentaire = merged.new_commentaire_1
from merged 
where action_commentaire.collectivite_id = merged.collectivite_id
and action_commentaire.action_id in (a, b);

$$ language sql;
comment on function private.merge_action_commentaire is
    'Merge les commentaires de deux actions en les concaténant.';

COMMIT;
