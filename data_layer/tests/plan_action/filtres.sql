begin;
select plan(1);

update fiche_action set statut = 'En cours' where id = 1 or id = 2 or id = 5;
update fiche_action set niveau_priorite = 'Moyen' where id = 1 or id = 6;
update fiche_action set niveau_priorite = 'Bas' where id = 2;
select test.identify_as('yolo@dodo.com');
select ok ((select * from filter_fiches_action(
        collectivite_id := 1,
        sans_plan := false,
        axes_id := (array [1, 12])::integer[],
        sans_pilote := false,
        pilotes := null,
        sans_referent := false,
        referents := (select array_agg(distinct pe.*::personne)
                      from ((select nom, collectivite_id, id as tag_id, null as user_id
                             from personne_tag
                             where nom = 'Harry Cot')
                            union
                            (select null as nom, 1, null as tag_id, dcp.user_id as user_id
                             from dcp
                             where user_id = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9')) pe),
        sans_niveau := false,
        niveaux_priorite := (array ['Bas', 'Moyen'])::fiche_action_niveaux_priorite[],
        sans_statut := false,
        statuts := (array ['En cours'])::fiche_action_statuts[],
        sans_thematique := false,
        thematiques := null,
        sans_sous_thematique := false,
        sous_thematiques := null,
        sans_budget := false,
        budget_min := null,
        budget_max := null,
        sans_date := false,
        date_debut := null,
        date_fin := null,
        echeance := null,
        "limit" := 10)),
           'Le filtre devrait retourner 2 résultats');
rollback;