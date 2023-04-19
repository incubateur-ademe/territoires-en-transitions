-- Deploy tet:plan_action to pg

BEGIN;

alter table annexe
    add column fiche_id integer references fiche_action on delete cascade not null;


create view bibliotheque_annexe
as
with plan as (
    select faa.fiche_id, array_agg(d.plan_id) as ids
    from fiche_action_axe faa
             join plan_action_chemin d on faa.axe_id = d.axe_id
    group by faa.fiche_id
)
select a.id,
       a.collectivite_id,
       plan.ids                                   as plan_ids,
       a.fiche_id,
       fs.snippet                                 as fichier,
       a.lien,
       a.commentaire,
       a.modified_at                              as created_at,
       a.modified_by                              as created_by,
       utilisateur.modified_by_nom(a.modified_by) as created_by_nom
from annexe a
         left join labellisation.bibliotheque_fichier_snippet fs
                   on fs.id = a.fichier_id
         left join plan using(fiche_id)
where can_read_acces_restreint(a.collectivite_id);
comment on view bibliotheque_annexe is
    'Les fichiers ou les liens pour les annexes des fiches action dans un format similaire à la vue `preuve`';

-- Permet aux RLS de la table de s'appliquer aux requêtes de la vue.
-- alter view bibliotheque_annexe set (security_invoker = on);

drop function if exists ajouter_annexe;
create function private.ajouter_annexe(annexe annexe) returns annexe
    language plpgsql
as
$$
declare
    id_annexe integer;
begin
    id_annexe = annexe.id;
    if id_annexe is null then
        insert into annexe (collectivite_id, fichier_id, url, titre, commentaire, fiche_id)
        values (annexe.collectivite_id, annexe.fichier_id, annexe.url, annexe.titre, annexe.commentaire, annexe.fiche_id)
        returning id into id_annexe;
        annexe.id = id_annexe;
    end if;
    return annexe;
end;
$$;

drop function if exists enlever_annexe;
drop table fiche_action_annexe;

COMMIT;
