alter table absract_modified_at
    rename to abstract_modified_at;

alter table abstract_modified_at
    enable row level security;

create function update_modified_at() returns trigger
as
$$
begin
    new.modified_at = now();
    return new;
end;
$$ language plpgsql;



create trigger set_modified_at_before_indicateur_definition_update
    before update
    on
        indicateur_definition
    for each row
execute procedure update_modified_at();

create trigger set_modified_at_before_action_definition_update
    before update
    on
        action_definition
    for each row
execute procedure update_modified_at();
create trigger set_modified_at_before_action_computed_points_update
    before update
    on
        action_computed_points
    for each row
execute procedure update_modified_at();

create trigger set_modified_at_before_action_commentaire_update
    before update
    on
        action_commentaire
    for each row
execute procedure update_modified_at();

create trigger set_modified_at_before_indicateur_resultat_update
    before update
    on
        indicateur_resultat
    for each row
execute procedure update_modified_at();

create trigger set_modified_at_before_indicateur_objectif_update
    before update
    on
        indicateur_objectif
    for each row
execute procedure update_modified_at();

create trigger set_modified_at_before_indicateur_commentaire_update
    before update
    on
        indicateur_commentaire
    for each row
execute procedure update_modified_at();

create trigger set_modified_at_before_indicateur_personnalise_def_update
    before update
    on
        indicateur_personnalise_definition
    for each row
execute procedure update_modified_at();

create trigger set_modified_at_before_indicateur_personnalise_res_update
    before update
    on
        indicateur_personnalise_resultat
    for each row
execute procedure update_modified_at();

create trigger set_modified_at_before_indicateur_personnalise_objectif_update
    before update
    on
        indicateur_personnalise_objectif
    for each row
execute procedure update_modified_at();


create trigger set_modified_at_before_fiche_action_update
    before update
    on
        fiche_action
    for each row
execute procedure update_modified_at();


create trigger set_modified_at_before_plan_action_update
    before update
    on
        plan_action
    for each row
execute procedure update_modified_at();

create trigger set_modified_at_before_reponse_choix_update
    before update
    on
        indicateur_commentaire
    for each row
execute procedure update_modified_at();
