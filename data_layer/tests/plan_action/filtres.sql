begin;
select plan(1);

update fiche_action set statut = 'En cours' where id = 1 or id = 2 or id = 5;
update fiche_action set niveau_priorite = 'Moyen' where id = 1 or id = 6;
update fiche_action set niveau_priorite = 'Bas' where id = 2;
select test.identify_as('yolo@dodo.com');
select ok ((select count(*)=2 from filter_fiches_action(
        collectivite_id := 1,
        axes_id := (array [1, 12])::integer[],
        pilotes := null,
        niveaux_priorite := (array ['Bas', 'Moyen'])::fiche_action_niveaux_priorite[],
        statuts := (array ['En cours'])::fiche_action_statuts[],
        referents := (select array_agg(distinct pe.*::personne)
                      from ((select nom, collectivite_id, id as tag_id, null as user_id
                             from personne_tag
                             where nom = 'Harry Cot')
                            union
                            (select null as nom, 1, null as tag_id, dcp.user_id as user_id
                             from dcp
                             where user_id = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9')) pe))),
           'Le filtre devrait retourner 2 résultats');
rollback;