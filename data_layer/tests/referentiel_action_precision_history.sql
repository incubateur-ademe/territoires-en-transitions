begin;
select plan(3);

drop trigger if exists set_modified_at_before_action_commentaire_update on action_commentaire;

truncate action_commentaire;
truncate historique.action_precision;
select test.identify_as('yolo@dodo.com');

insert into action_commentaire(collectivite_id, action_id, commentaire, modified_at)
values (1, 'cae_1.1.1.1.1', 'un commentaire de Yolo en cours', '2022-09-09 12:00:00.000000');

insert into action_commentaire(collectivite_id, action_id, commentaire, modified_at)
values (1, 'cae_1.1.1.1.1', 'un commentaire de Yolo finalisé', '2022-09-09 12:10:00.000000')
on conflict (collectivite_id, action_id)
    do update set commentaire = excluded.commentaire,
                  modified_by = excluded.modified_by,
                  modified_at = excluded.modified_at;

select ok((select count(*) = 1 from historique.action_precision),
          'Si un même utilisateur met à jour le champ précision, une seule historisation a lieu.');


select test.identify_as('yili@didi.com');
insert into action_commentaire(collectivite_id, action_id, commentaire, modified_at)
values (1, 'cae_1.1.1.1.1', 'un commentaire de Yili', '2022-09-09 12:15:00.000000')
on conflict (collectivite_id, action_id)
    do update set commentaire = excluded.commentaire,
                  modified_by = excluded.modified_by,
                  modified_at = excluded.modified_at;

select ok((select count(*) = 2 from historique.action_precision),
          'Si un autre utilisateur met à jour le champ précision, une nouvelle historisation a lieu.');


select *
into expected_history
from historique.action_precision
where false;
insert into expected_history (id, collectivite_id, action_id, precision, previous_precision, modified_by, previous_modified_by, modified_at, previous_modified_at)
values  (2, 1, 'cae_1.1.1.1.1', 'un commentaire de Yolo finalisé', 'un commentaire de Yolo en cours', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', null, '2022-09-09 12:10:00.000000 +00:00', null),
        (3, 1, 'cae_1.1.1.1.1', 'un commentaire de Yili', 'un commentaire de Yolo finalisé', '3f407fc6-3634-45ff-a988-301e9088096a', '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', '2022-09-09 12:15:00.000000 +00:00', '2022-09-09 12:10:00.000000 +00:00');

select set_eq('select collectivite_id,action_id,precision,previous_precision,modified_by,previous_modified_by,modified_at,previous_modified_at from historique.action_precision',
              'select collectivite_id,action_id,precision,previous_precision,modified_by,previous_modified_by,modified_at,previous_modified_at from expected_history',
              'L''historique doit être égale à la version prévue.');

rollback;
