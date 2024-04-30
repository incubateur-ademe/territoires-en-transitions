-- Deploy tet:plan_action/fiches to pg
BEGIN;

create or replace function
    create_fiche(
    collectivite_id int,
    axe_id int default null,
    action_id action_id default null,
    indicateur_referentiel_id indicateur_id default null,
    indicateur_personnalise_id int default null
)
    returns fiche_resume
    language plpgsql
    volatile
as
$$
declare
    new_fiche_id int;
    resume       fiche_resume;
begin
    if not have_edition_acces(create_fiche.collectivite_id) and not is_service_role()
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    insert into fiche_action (collectivite_id, titre)
    values (create_fiche.collectivite_id, '')
    returning id into new_fiche_id;

    if create_fiche.axe_id is not null
    then
        insert into fiche_action_axe (fiche_id, axe_id)
        values (new_fiche_id, create_fiche.axe_id);
    end if;

    if create_fiche.action_id is not null
    then
        insert into fiche_action_action (fiche_id, action_id)
        values (new_fiche_id, create_fiche.action_id);
    end if;

    if create_fiche.indicateur_referentiel_id is not null
    then
        insert into fiche_action_indicateur (fiche_id, indicateur_id)
        values (new_fiche_id, create_fiche.indicateur_referentiel_id);
    end if;

    if create_fiche.indicateur_personnalise_id is not null
    then
        insert into fiche_action_indicateur (fiche_id, indicateur_personnalise_id)
        values (new_fiche_id, create_fiche.indicateur_personnalise_id);
    end if;

    select * from fiche_resume where id = new_fiche_id limit 1 into resume;
    return resume;
end;
$$;

alter table fiche_action_pilote
    drop constraint one_user_per_fiche;

alter table fiche_action_pilote
    drop constraint one_tag_per_fiche;

alter table fiche_action_pilote
    add constraint fiche_action_pilote_fiche_id_user_id_tag_id_key unique (fiche_id, user_id, tag_id);

COMMIT;
