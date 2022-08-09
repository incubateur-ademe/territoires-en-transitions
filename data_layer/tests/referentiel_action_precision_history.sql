begin;
select plan(3);

drop trigger if exists set_modified_at_before_action_commentaire_update on action_commentaire;

truncate action_commentaire;
truncate history.action_precision;
select test.identify_as('yolo@dodo.com');

insert into action_commentaire(collectivite_id, action_id, commentaire, modified_at)
values (1, 'cae_1.1.1.1.1', 'un commentaire de Yolo en cours', '2022-09-09 12:00:00.000000');

insert into action_commentaire(collectivite_id, action_id, commentaire, modified_at)
values (1, 'cae_1.1.1.1.1', 'un commentaire de Yolo finalisé', '2022-09-09 12:10:00.000000')
on conflict (collectivite_id, action_id)
    do update set commentaire  = excluded.commentaire,
                  modified_by = excluded.modified_by,
                  modified_at = excluded.modified_at;

select ok((select count(*) = 1  from history.action_precision), 'Si un même utilisateur met à jour le champ précision, une seule historisation a lieu.');


select test.identify_as('yili@didi.com');
insert into action_commentaire(collectivite_id, action_id, commentaire, modified_at)
values (1, 'cae_1.1.1.1.1', 'un commentaire de Yili', '2022-09-09 12:15:00.000000')
on conflict (collectivite_id, action_id)
    do update set commentaire  = excluded.commentaire,
                  modified_by = excluded.modified_by,
                  modified_at = excluded.modified_at;

select ok((select count(*) = 2 from history.action_precision), 'Si un autre utilisateur met à jour le champ précision, une nouvelle historisation a lieu.');


select *
into expected_history
from historical_action_precision
where false;
insert into expected_history (tache_id, action_id, tache_identifiant, tache_nom, action_identifiant, action_nom,
                              collectivite_id, precision, previous_precision,
                              modified_by, modified_at, nom)
values ('cae_1.1.1.1.1', 'cae_1.1.1', '1.1.1.1.1',
        'Formaliser une vision et des engagements dans une décision de politique générale (délibération)', '1.1.1',
        'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie', 1, 'un commentaire de Yili', 'un commentaire de Yolo finalisé', 
        '3f407fc6-3634-45ff-a988-301e9088096a', '2022-09-09 12:15:00.000000', 'Yili Didi'),
       ('cae_1.1.1.1.1', 'cae_1.1.1', '1.1.1.1.1',
        'Formaliser une vision et des engagements dans une décision de politique générale (délibération)', '1.1.1',
        'Définir la vision, les objectifs et la stratégie Climat-Air-Énergie', 1, 'un commentaire de Yolo finalisé', 'un commentaire de Yolo en cours', 
        '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', '2022-09-09 12:10:00.000000', 'Yolo Dodo');

select set_eq('select * from historical_action_precision',
              'select * from expected_history',
              'L''historique doit être égale à la version prévue.');

rollback;
