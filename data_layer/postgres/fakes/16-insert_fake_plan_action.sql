truncate table axe cascade;

insert into public.axe (id, nom, collectivite_id, parent)
values (1, 'Plan', 1, null);

insert into public.axe (id, nom, collectivite_id, parent)
values (2, 'Axe', 1, 1);

insert into fiche_action (id, titre, description, thematiques, piliers_eci, collectivite_id)
values (1,
        'fiche 1',
        'test description',
        array [
            'Bâtiments'::fiche_action_thematiques
            ],
        array [
            'Écoconception'::fiche_action_piliers_eci,
            'Recyclage'::fiche_action_piliers_eci
            ],
        1),
       (2, 'fiche 2', 'test description', array []::fiche_action_thematiques[], array []::fiche_action_piliers_eci[],1),
       (3, 'fiche 3', 'test description', array []::fiche_action_thematiques[], array []::fiche_action_piliers_eci[], 2)
;
