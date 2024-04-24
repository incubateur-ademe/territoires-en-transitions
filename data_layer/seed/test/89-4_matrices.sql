create type test.crud_element as
(
    kind confidentialite_type_element,
    name text
);

-- todo on devrait nommer les matrices avec le métier.
do
$$
    declare
        disallowed_for_all test.crud_element[] = array
            [
            -- Panier d'action: ces tables servent à sauvegarder des données lors de la creation du plan
            ('table', 'action_impact_fiche_action'),
            ('table', 'action_impact_effet_attendu')
            ];
        crud_for_all       test.crud_element[] = array
            [
            -- Panier d'action: tout le monde peut tout faire sur le panier
            ('table', 'panier'),
            ('table', 'action_impact_panier'),
            ('table', 'action_impact_statut'),
            ('table', 'action_impact_state')
            ];
        r_for_all          test.crud_element[] = array
            [
            -- Panier d'action: les tables avec les définitions des actions
            ('table', 'action_impact_categorie'),
            ('table', 'action_impact_indicateur'),
            ('table', 'action_impact_action'),
            ('table', 'action_impact_categorie_fnv'),
            ('table', 'action_impact_banatic_competence'),
            ('table', 'action_impact_sous_thematique'),
            ('table', 'action_impact_thematique'),
            ('table', 'action_impact'),
            ('table', 'effet_attendu'),
            ('table', 'action_impact_temps_de_mise_en_oeuvre'),
            ('table', 'action_impact_fourchette_budgetaire'),
            ('table', 'action_impact_complexite'),
            ('table', 'categorie_fnv')
            ];
        curr_element       test.crud_element;
    begin
        foreach curr_element in array disallowed_for_all
            loop
                insert into confidentialite_crud (type_element, nom_element, profil, c, r, u, d)
                values ('table', curr_element.name, 'public', 'non', 'non', 'non', 'non'),
                       ('table', curr_element.name, 'connecte', 'non', 'non', 'non', 'non'),
                       ('table', curr_element.name, 'verifie', 'non', 'non', 'non', 'non'),
                       ('table', curr_element.name, 'support', 'non', 'non', 'non', 'non'),
                       ('table', curr_element.name, 'lecture', 'non', 'non', 'non', 'non'),
                       ('table', curr_element.name, 'edition', 'non', 'non', 'non', 'non'),
                       ('table', curr_element.name, 'admin', 'non', 'non', 'non', 'non'),
                       ('table', curr_element.name, 'auditeur', 'non', 'non', 'non', 'non');
            end loop;
        foreach curr_element in array crud_for_all
            loop
                insert into confidentialite_crud (type_element, nom_element, profil, c, r, u, d)
                values ('table', curr_element.name, 'public', 'oui', 'oui', 'oui', 'oui'),
                       ('table', curr_element.name, 'connecte', 'oui', 'oui', 'oui', 'oui'),
                       ('table', curr_element.name, 'verifie', 'oui', 'oui', 'oui', 'oui'),
                       ('table', curr_element.name, 'support', 'oui', 'oui', 'oui', 'oui'),
                       ('table', curr_element.name, 'lecture', 'oui', 'oui', 'oui', 'oui'),
                       ('table', curr_element.name, 'edition', 'oui', 'oui', 'oui', 'oui'),
                       ('table', curr_element.name, 'admin', 'oui', 'oui', 'oui', 'oui'),
                       ('table', curr_element.name, 'auditeur', 'oui', 'oui', 'oui', 'oui');
            end loop;
        foreach curr_element in array r_for_all
            loop
                insert into confidentialite_crud (type_element, nom_element, profil, c, r, u, d)
                values ('table', curr_element.name, 'public', 'non', 'oui', 'non', 'non'),
                       ('table', curr_element.name, 'connecte', 'non', 'oui', 'non', 'non'),
                       ('table', curr_element.name, 'verifie', 'non', 'oui', 'non', 'non'),
                       ('table', curr_element.name, 'support', 'non', 'oui', 'non', 'non'),
                       ('table', curr_element.name, 'lecture', 'non', 'oui', 'non', 'non'),
                       ('table', curr_element.name, 'edition', 'non', 'oui', 'non', 'non'),
                       ('table', curr_element.name, 'admin', 'non', 'oui', 'non', 'non'),
                       ('table', curr_element.name, 'auditeur', 'non', 'oui', 'non', 'non');
            end loop;
    end
$$;
