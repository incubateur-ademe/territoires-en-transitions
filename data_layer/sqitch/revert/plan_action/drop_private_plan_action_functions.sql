-- Revert tet:plan_action/drop_private_plan_action_functions from pg

BEGIN;

-- On revert, we recreate the private helper functions with their original bodies

create or replace function private.ajouter_thematique(
    fiche_id integer,
    thematique text
) returns void as $$
begin
    insert into fiche_action_thematique
    values (ajouter_thematique.fiche_id, ajouter_thematique.thematique);
end;
$$ language plpgsql;

create or replace function private.ajouter_sous_thematique(
    fiche_id integer,
    thematique_id integer
) returns void as $$
begin
    insert into fiche_action_sous_thematique
    values (ajouter_sous_thematique.fiche_id, ajouter_sous_thematique.thematique_id);
end;
$$ language plpgsql;

create or replace function private.ajouter_partenaire(
    fiche_id integer,
    partenaire partenaire_tag
) returns partenaire_tag as $$
declare
    id_tag integer;
    id_fiche integer;
begin
    id_fiche = fiche_id;
    insert into partenaire_tag (nom, collectivite_id)
    values(partenaire.nom, partenaire.collectivite_id)
    on conflict (nom, collectivite_id) do update set nom = partenaire.nom
    returning id into id_tag;
    partenaire.id = id_tag;
    insert into fiche_action_partenaire_tag
    values (id_fiche, id_tag);
    return partenaire;
end;
$$ language plpgsql;

create or replace function private.ajouter_structure(
    fiche_id integer,
    structure structure_tag
) returns structure_tag as $$
declare
    id_tag integer;
    id_fiche integer;
begin
    id_fiche = fiche_id;
    insert into structure_tag (nom, collectivite_id)
    values (structure.nom, structure.collectivite_id)
    on conflict (nom, collectivite_id) do update set nom = structure.nom
    returning id into id_tag;
    structure.id = id_tag;
    insert into fiche_action_structure_tag
    values (id_fiche, id_tag);
    return structure;
end;
$$ language plpgsql;

create or replace function private.ajouter_service(
    fiche_id integer,
    service service_tag
) returns service_tag as $$
declare
    id_tag integer;
    id_fiche integer;
begin
    id_fiche = fiche_id;
    insert into service_tag (nom, collectivite_id)
    values(service.nom, service.collectivite_id)
    on conflict (nom, collectivite_id) do update set nom = service.nom
    returning id into id_tag;
    service.id = id_tag;
    insert into fiche_action_service_tag
    values (id_fiche, id_tag);
    return service;
end;
$$ language plpgsql;

create or replace function private.ajouter_pilote(
    fiche_id integer,
    pilote personne
) returns personne as $$
declare
    id_tag integer;
    id_fiche integer;
begin
    id_fiche = fiche_id;
    if pilote.user_id is null then
        insert into personne_tag (nom, collectivite_id)
        values (pilote.nom,  pilote.collectivite_id)
        on conflict (nom, collectivite_id) do update set nom = pilote.nom
        returning id into id_tag;
        pilote.tag_id = id_tag;
        insert into fiche_action_pilote (fiche_id, user_id, tag_id)
        values (id_fiche, null, id_tag);
    else
        insert into fiche_action_pilote (fiche_id, user_id, tag_id)
        values (id_fiche, pilote.user_id, null);
    end if;
    return pilote;
end;
$$ language plpgsql;

create or replace function private.ajouter_referent(
    fiche_id integer,
    referent personne
) returns personne as $$
declare
    id_tag integer;
    id_fiche integer;
begin
    id_fiche = fiche_id;
    if referent.user_id is null then
        id_tag = referent.tag_id;
        if id_tag is null then
            insert into personne_tag (nom, collectivite_id)
            values (referent.nom,  referent.collectivite_id)
            on conflict (nom, collectivite_id) do update set nom = referent.nom
            returning id into id_tag;
            referent.tag_id = id_tag;
        end if;
        insert into fiche_action_referent (fiche_id, user_id, tag_id)
        values (id_fiche, null, id_tag);
    else
        insert into fiche_action_referent (fiche_id, user_id, tag_id)
        values (id_fiche, referent.user_id, null);
    end if;
    return referent;
end;
$$ language plpgsql;

create or replace function private.ajouter_action(
    fiche_id integer,
    action_id action_id
) returns void as $$
begin
    insert into fiche_action_action
    values (ajouter_action.fiche_id, ajouter_action.action_id);
end;
$$ language plpgsql;

create or replace function private.ajouter_financeur(
    fiche_id integer,
    financeur financeur_montant
) returns financeur_montant as $$
declare
    id_tag integer;
    id_fiche integer;
    id_montant integer;
    tag_financeur financeur_tag;
begin
    id_fiche = fiche_id;
    tag_financeur = financeur.financeur_tag;
    insert into financeur_tag (nom, collectivite_id)
    values(tag_financeur.nom, tag_financeur.collectivite_id)
    on conflict (nom, collectivite_id) do update set nom = tag_financeur.nom
    returning id into id_tag;
    tag_financeur.id = id_tag;
    insert into fiche_action_financeur_tag (fiche_id, financeur_tag_id, montant_ttc)
    values (id_fiche, id_tag, financeur.montant_ttc)
    returning id into id_montant;
    financeur.id = id_montant;
    financeur.financeur_tag = tag_financeur;
    return financeur;
end;
$$ language plpgsql;

COMMIT;

