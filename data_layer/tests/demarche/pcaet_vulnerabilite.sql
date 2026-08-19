begin;
select plan(10);

select id as collectivite_id
into temporary table test_collectivite
from test_create_collectivite('CC de la Vallée Sèche');

insert into demarche (collectivite_id, type, titre)
select tc.collectivite_id, 'pcaet', 'PCAET de test' from test_collectivite tc;

-- Le socle fait partie du contrat de la migration : sans lui le tableau de
-- vulnérabilité est vide et rien n'est exigible au dépôt.

-- Recadré à 9 thématiques par demarche/pcaet_vulnerabilite_thematique_socle_recadre :
-- la liste indicative du cadre de dépôt (16 thématiques) était trop large à l'usage.
select is(
       (select count(*)::int from demarche_pcaet_vulnerabilite_thematique
         where collectivite_id is null),
       9,
       'Les 9 thématiques du socle doivent être seedées'
   );

select is(
       (select array_agg(code order by display_order)
          from demarche_pcaet_vulnerabilite_thematique
         where collectivite_id is null),
       array['agriculture', 'amenagement', 'batiments', 'biodiversite', 'eau',
             'foret', 'energie', 'economie', 'sante'],
       'Les thématiques du socle suivent la liste et l''ordre du proto'
   );

-- L'échappatoire offerte à la collectivité est « non concerné », pas la dispense.
select is_empty(
       $$ select code from demarche_pcaet_vulnerabilite_thematique
           where collectivite_id is null and not requis $$,
       'Toutes les thématiques du socle sont requises'
   );

-- Une thématique du socle sans code ne serait plus identifiable par une migration.
select is_empty(
       $$ select label from demarche_pcaet_vulnerabilite_thematique
           where collectivite_id is null and code is null $$,
       'Toute thématique du socle porte un code métier'
   );

select throws_ok(
       $$ insert into demarche_pcaet_vulnerabilite_thematique
              (code, label, collectivite_id, requis, display_order)
          values ('eau', 'Eau bis', null, true, 900) $$,
       23505,
       null,
       'Le code d''une thématique du socle est unique'
   );

-- Une thématique ajoutée n'a pas de code : rien n'en garantirait l'unicité globale.
select throws_ok(
       format($$ insert into demarche_pcaet_vulnerabilite_thematique
                     (code, label, collectivite_id, requis, display_order)
                 values ('ma_thematique', 'Ma thématique', %s, false, 1001) $$,
              (select collectivite_id from test_collectivite)),
       23514,
       null,
       'Une thématique ajoutée par une collectivité ne peut pas porter de code métier'
   );

insert into demarche_pcaet_vulnerabilite_thematique
    (code, label, collectivite_id, requis, display_order)
select null, 'Zones humides', tc.collectivite_id, false, 1001
from test_collectivite tc;

select throws_ok(
       format($$ insert into demarche_pcaet_vulnerabilite_thematique
                     (code, label, collectivite_id, requis, display_order)
                 values (null, 'zones humides', %s, false, 1002) $$,
              (select collectivite_id from test_collectivite)),
       23505,
       null,
       'Une collectivité ne peut pas ajouter deux fois la même thématique, à la casse près'
   );

-- Il n'y a pas de niveau « non renseigné » : l'absence de valeur est un NULL.
select throws_ok(
       format($$ insert into demarche_pcaet_vulnerabilite_valeur
                     (demarche_id, thematique_id, niveau_2050)
                 values (%s, %s, 'non_renseigne') $$,
              (select d.id from demarche d
                 join test_collectivite tc on tc.collectivite_id = d.collectivite_id),
              (select id from demarche_pcaet_vulnerabilite_thematique where code = 'eau')),
       23514,
       null,
       'Les niveaux se limitent à non_concerne, faible, moyen et fort'
   );

-- Supprimer une thématique ajoutée emporte les valeurs de toutes les démarches de
-- la collectivité : c'est ce qui rend l'action destructrice côté interface.
insert into demarche_pcaet_vulnerabilite_valeur
    (demarche_id, thematique_id, niveau_maintenant)
select d.id, thematique.id, 'moyen'
from demarche d
join test_collectivite tc on tc.collectivite_id = d.collectivite_id
join demarche_pcaet_vulnerabilite_thematique thematique
  on thematique.collectivite_id = tc.collectivite_id and thematique.label = 'Zones humides';

delete from demarche_pcaet_vulnerabilite_thematique
where label = 'Zones humides'
  and collectivite_id = (select collectivite_id from test_collectivite);

select is_empty(
       $$ select demarche_id from demarche_pcaet_vulnerabilite_valeur $$,
       'La suppression d''une thématique emporte ses valeurs'
   );

-- Une démarche supprimée n'emporte pas le socle, seulement sa propre saisie.
insert into demarche_pcaet_vulnerabilite_valeur
    (demarche_id, thematique_id, niveau_maintenant)
select d.id, thematique.id, 'fort'
from demarche d
join test_collectivite tc on tc.collectivite_id = d.collectivite_id
cross join demarche_pcaet_vulnerabilite_thematique thematique
where thematique.code = 'eau';

delete from demarche
where collectivite_id = (select collectivite_id from test_collectivite);

select is(
       (select count(*)::int from demarche_pcaet_vulnerabilite_thematique
         where collectivite_id is null),
       9,
       'Supprimer une démarche n''entame pas le socle des thématiques'
   );

rollback;
