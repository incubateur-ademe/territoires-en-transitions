-- Deploy tet:plan_action to pg

BEGIN;

create function deplacer_fiche_action_dans_un_axe(
    fiche_id integer,
    old_axe_id integer,
    new_axe_id integer
) returns void as
$$
begin
    perform ajouter_fiche_action_dans_un_axe(fiche_id, new_axe_id);
    perform enlever_fiche_action_d_un_axe(fiche_id, old_axe_id);
end;
$$ language plpgsql;
comment on function deplacer_fiche_action_dans_un_axe is
    'Déplace une fiche d''un axe à l''autre.';

COMMIT;
