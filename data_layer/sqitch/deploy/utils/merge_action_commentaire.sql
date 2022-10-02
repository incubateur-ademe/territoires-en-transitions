-- Deploy tet:utils/merge_action_commentaire to pg

BEGIN;

create function
    private.merge_action_commentaire(a action_id, b action_id)
    returns void
as
$$
with commentaire_a as (select * from action_commentaire where action_id = a),
     commentaire_b as (select * from action_commentaire where action_id = b),
     merged as (select commentaire_a.collectivite_id,
                       case -- si les commentaires sont identiques, alors le résultat du merge est null.
                           when commentaire_a.commentaire != commentaire_b.commentaire then
                               concat(commentaire_a.commentaire, ' ', commentaire_b.commentaire) end as commentaire
                from commentaire_a
                         left join commentaire_b on commentaire_a.collectivite_id = commentaire_b.collectivite_id)
update action_commentaire
set commentaire = merged.commentaire
from merged
where merged.commentaire is not null -- on update seulement si les commentaires ont étés fusionnés
  and action_commentaire.collectivite_id = merged.collectivite_id
  and action_commentaire.action_id in (a, b);

$$ language sql;
comment on function private.merge_action_commentaire is
    'Fusionne les commentaires de deux actions en les concaténant. '
        'Si les commentaires a et b sont différents, alors leurs valeurs deviendront "a b".';

COMMIT;
