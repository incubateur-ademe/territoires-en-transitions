-- Rejoue le deploy de plan_action/fiche_jauge_init, qui commite : pas de begin/rollback, les fiches de test sont supprimées à la fin.
select plan(8);

insert into fiche_action (titre, collectivite_id, statut, modified_at)
values ('Jauge init - Réalisé', 1, 'Réalisé', '2024-01-15 10:00+00')
returning id as realise \gset
insert into fiche_action (titre, collectivite_id, statut, modified_at)
values ('Jauge init - En cours', 1, 'En cours', '2024-01-15 10:00+00')
returning id as en_cours \gset
insert into fiche_action (titre, collectivite_id, parent_id, statut, modified_at)
values ('Jauge init - sous-action Réalisé', 1, :realise, 'Réalisé', '2024-01-15 10:00+00')
returning id as sous_action \gset

select count(*) as historique_avant
from historique.fiche_action
where fiche_id in (:realise, :en_cours, :sous_action) \gset

\ir ../../sqitch/deploy/plan_action/fiche_jauge_init.sql

select is((select jauge from fiche_action where id = :realise), 100, 'Une fiche Réalisé passe à 100 %');
select is((select jauge from fiche_action where id = :en_cours), 0, 'Une fiche En cours reste à 0 %');
select is((select jauge from fiche_action where id = :sous_action), 0, 'Une sous-action Réalisé reste à 0 %');
select is(
    (select count(*) from historique.fiche_action where fiche_id in (:realise, :en_cours, :sous_action)),
    :historique_avant::bigint,
    'Aucune ligne d''historique n''est écrite'
);
select is(
    (select count(*) from fiche_action
     where id in (:realise, :en_cours, :sous_action) and modified_at = '2024-01-15 10:00+00'),
    3::bigint,
    'modified_at est inchangé'
);

update fiche_action set jauge = 40 where id = :en_cours;
select count(*) as historique_avant_relance
from historique.fiche_action
where fiche_id in (:realise, :en_cours, :sous_action) \gset

\ir ../../sqitch/deploy/plan_action/fiche_jauge_init.sql

select is((select jauge from fiche_action where id = :en_cours), 40, 'La relance ne touche pas une jauge saisie');
select is(
    (select count(*) from historique.fiche_action where fiche_id in (:realise, :en_cours, :sous_action)),
    :historique_avant_relance::bigint,
    'La relance n''écrit pas d''historique'
);
select ok(
    (select tgenabled = 'O' from pg_trigger
     where tgrelid = 'public.fiche_action'::regclass and tgname = 'save_history'),
    'Le trigger save_history est réactivé'
);

delete from fiche_action where id in (:sous_action, :en_cours, :realise);
delete from historique.fiche_action_pilote
where fiche_historise_id in (
    select id from historique.fiche_action where fiche_id in (:realise, :en_cours, :sous_action)
);
delete from historique.fiche_action where fiche_id in (:realise, :en_cours, :sous_action);

select * from finish();
