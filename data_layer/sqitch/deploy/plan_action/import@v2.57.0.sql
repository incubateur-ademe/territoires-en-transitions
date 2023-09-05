-- Deploy tet:plan_action/import to pg

BEGIN;

create or replace function import_plan_action_csv() returns trigger
    language plpgsql
as
$$
declare
    axe_id integer;
    fiche_id integer;
    elem_id integer;
    elem text;
    col_id integer;
    regex_split text = E'\(et/ou|[–,/+?&;]|\n|\r| - | -|- |^-| et (?!de)\)(?![^(]*[)])(?![^«]*[»])';
    regex_date text = E'^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/([0-9]{4})$';
begin
    col_id = new.collectivite_id::integer;

    -- Fiche action
    if new.titre is not null and trim(new.titre)<>'' then
        insert into fiche_action (titre, description, piliers_eci, objectifs, resultats_attendus, cibles, ressources, financements, budget_previsionnel, statut, niveau_priorite, date_debut, date_fin_provisoire, amelioration_continue, calendrier, notes_complementaires, maj_termine, collectivite_id)
        values (
                   left(case when new.num_action ='' then trim(new.titre) else concat(new.num_action, ' - ', trim(new.titre)) end, 300),
                   new.description,
                   null,
                   new.objectifs,
                   case when new.resultats_attendus <> '' then regexp_split_to_array(new.resultats_attendus, ' - ')::fiche_action_resultats_attendus[] else array[]::fiche_action_resultats_attendus[] end,
                   case when new.cibles <> '' then regexp_split_to_array(new.cibles, ' - ')::fiche_action_cibles[] else array[]::fiche_action_cibles[] end,
                   new.moyens,
                   new.financements,
                   case when new.budget <> '' then new.budget::integer end,
                   case when new.statut <> '' then trim(new.statut)::fiche_action_statuts end,
                   case when new.priorite <> '' then trim(new.priorite)::fiche_action_niveaux_priorite end,
                   case when regexp_match(new.date_debut, regex_date) is not null then to_date(trim(new.date_debut), 'DD/MM/YYYY') end,
                   case when regexp_match(new.date_fin, regex_date) is not null then to_date(trim(new.date_fin), 'DD/MM/YYYY') end,
                   not (new.amelioration_continue = 'FAUX' or new.amelioration_continue = 'False'),
                   new.calendrier,
                   new.notes,
                   true,
                   col_id)
        returning id into fiche_id;
    end if;

    -- Plan et axes
    if new.plan_nom is not null and trim(new.plan_nom) <> '' then
        axe_id = upsert_axe(new.plan_nom, col_id, null);
        if new.axe is not null and trim(new.axe) <> '' then
            axe_id = upsert_axe(new.axe, col_id, axe_id);
            if new.sous_axe is not null and trim(new.sous_axe) <> '' then
                axe_id = upsert_axe(new.sous_axe, col_id, axe_id);
                if new.sous_sous_axe is not null and trim(new.sous_sous_axe) <> '' then
                    axe_id = upsert_axe(new.sous_sous_axe, col_id, axe_id);
                end if;
            end if;
        end if;
    end if;
    if axe_id is not null and fiche_id is not null then
        perform ajouter_fiche_action_dans_un_axe(fiche_id, axe_id);
    end if;

    -- Partenaires
    for elem in select trim(unnest(regexp_split_to_array(new.partenaires, regex_split)))
        loop
            if elem <> '' then
                insert into partenaire_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_partenaire_tag (fiche_id, partenaire_tag_id)
                values (fiche_id, elem_id);
            end if;
        end loop;

    -- Structures
    for elem in select trim(unnest(regexp_split_to_array(new.structure_pilote, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into structure_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_structure_tag (fiche_id, structure_tag_id)
                values (fiche_id, elem_id);
            end if;
        end loop;

    -- Services
    for elem in select trim(unnest(regexp_split_to_array(new.service, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into service_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_service_tag (fiche_id, service_tag_id)
                values (fiche_id, elem_id);
            end if;
        end loop;

    -- Referents
    for elem in select trim(unnest(regexp_split_to_array(new.elu_referent, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into personne_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_referent (fiche_id, user_id, tag_id)
                values (fiche_id, null, elem_id);
            end if;
        end loop;

    -- Pilotes
    for elem in select trim(unnest(regexp_split_to_array(new.personne_referente, regex_split)))
        loop
            elem = trim(elem);
            if elem <> '' then
                insert into personne_tag (nom, collectivite_id)
                values(elem, col_id)
                on conflict (nom, collectivite_id) do update set nom = elem
                returning id into elem_id;

                insert into fiche_action_pilote (fiche_id, user_id, tag_id)
                values (fiche_id, null, elem_id);
            end if;
        end loop;

    -- Financeur 1
    elem = trim(new.financeur_un);
    if elem <> '' then
        insert into financeur_tag (nom, collectivite_id)
        values(elem, col_id)
        on conflict (nom, collectivite_id) do update set nom = elem
        returning id into elem_id;

        insert into fiche_action_financeur_tag (fiche_id, financeur_tag_id, montant_ttc)
        values (fiche_id, elem_id, case when new.montant_un <> '' then new.montant_un::integer end);
    end if;

    -- Financeur 2
    elem = trim(new.financeur_deux);
    if elem <> '' then
        insert into financeur_tag (nom, collectivite_id)
        values(elem, col_id)
        on conflict (nom, collectivite_id) do update set nom = elem
        returning id into elem_id;

        insert into fiche_action_financeur_tag (fiche_id, financeur_tag_id, montant_ttc)
        values (fiche_id, elem_id, case when new.montant_deux <> '' then new.montant_deux::integer end);
    end if;

    -- Financeur 3
    elem = trim(new.financeur_trois);
    if elem <> '' then
        insert into financeur_tag (nom, collectivite_id)
        values(elem, col_id)
        on conflict (nom, collectivite_id) do update set nom = elem
        returning id into elem_id;

        insert into fiche_action_financeur_tag (fiche_id, financeur_tag_id, montant_ttc)
        values (fiche_id, elem_id, case when new.montant_trois <> '' then new.montant_trois::integer end);
    end if;

    return new;
end;
$$;

COMMIT;
