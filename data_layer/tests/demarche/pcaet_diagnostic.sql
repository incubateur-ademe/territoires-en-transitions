begin;
select plan(11);

-- Le contenu seedé fait partie du contrat de la migration : sans lui l'écran
-- diagnostic est vide, et les identifiants doivent résoudre dans le référentiel
-- CAE importé.

select is(
       (select count(*)::int from demarche_pcaet_topic),
       6,
       'Les 6 topics du diagnostic doivent être seedés'
   );

-- L'ordre est celui que le ministère demande pour la présentation du
-- diagnostic, pas celui du référentiel CAE.
select is(
       (select array_agg(code order by display_order) from demarche_pcaet_topic),
       array['profil_energie_climat', 'polluants_atmospheriques', 'sequestration',
             'consommation_energetique', 'enr', 'vulnerabilite_territoire'],
       'Les topics doivent être ordonnés comme les onglets de l''écran'
   );

select is(
       (select count(*)::int from demarche_pcaet_topic_row),
       100,
       'Les 100 lignes du diagnostic doivent être seedées'
   );

-- Granularité du décret : les émissions de GES et la consommation énergétique
-- s'arrêtent aux 8 secteurs, sans descendre aux sous-secteurs.
select is(
       (select array_agg(r.referentiel_id order by r.display_order)
          from demarche_pcaet_topic_row r
          join demarche_pcaet_topic t on t.id = r.topic_id
         where t.code = 'profil_energie_climat'),
       array['cae_1.c', 'cae_1.d', 'cae_1.e', 'cae_1.f',
             'cae_1.g', 'cae_1.h', 'cae_1.i', 'cae_1.j'],
       'Le profil énergie climat porte les 8 secteurs du décret'
   );

select is(
       (select array_agg(r.referentiel_id order by r.display_order)
          from demarche_pcaet_topic_row r
          join demarche_pcaet_topic t on t.id = r.topic_id
         where t.code = 'consommation_energetique'),
       array['cae_2.e', 'cae_2.f', 'cae_2.g', 'cae_2.h',
             'cae_2.i', 'cae_2.j', 'cae_2.k', 'cae_2.l_pcaet'],
       'La consommation énergétique finale porte les mêmes 8 secteurs'
   );

-- Seules la forêt et les terres agricoles sont obligatoires pour la séquestration.
select is(
       (select array_agg(r.referentiel_id order by r.display_order)
          from demarche_pcaet_topic_row r
          join demarche_pcaet_topic t on t.id = r.topic_id
         where t.code = 'sequestration' and r.requis),
       array['cae_63.b', 'cae_63.c'],
       'La séquestration ne rend obligatoires que la forêt et les terres agricoles'
   );

select is(
       (select count(*)::int
          from demarche_pcaet_topic_row r
          join demarche_pcaet_topic t on t.id = r.topic_id
         where t.code = 'polluants_atmospheriques' and r.parent_id is not null),
       54,
       'Le topic polluants décline les 6 polluants par les 9 secteurs'
   );

-- La grille n'affiche que deux niveaux : le référentiel ne doit pas aller plus loin.
select is_empty(
       $$ select enfant.label
            from demarche_pcaet_topic_row enfant
            join demarche_pcaet_topic_row parent on parent.id = enfant.parent_id
           where parent.parent_id is not null $$,
       'Aucune ligne ne doit descendre sous le second niveau'
   );

-- Un topic à indicateurs sans unité ferait retomber la grille sur une déduction.
select is_empty(
       $$ select code from demarche_pcaet_topic
           where kind = 'indicateurs' and (unit is null or group_label is null) $$,
       'Tout topic à indicateurs porte son unité et le nom de son premier niveau'
   );

select is_empty(
       $$ select r.referentiel_id
            from demarche_pcaet_topic_row r
            left join indicateur_definition d
                   on d.identifiant_referentiel = r.referentiel_id
           where r.referentiel_id is not null and d.id is null $$,
       'Chaque ligne pointe sur une définition d''indicateur existante'
   );

-- Le filtre `groupement` masque les indicateurs de trajectoire SNBC : à la
-- granularité du décret, aucune ligne du diagnostic n'est concernée.
select is_empty(
       $$ select r.referentiel_id
            from demarche_pcaet_topic_row r
            join indicateur_definition d
              on d.identifiant_referentiel = r.referentiel_id
           where d.groupement_id is not null $$,
       'Aucune ligne du diagnostic ne dépend d''un groupement d''indicateurs'
   );

rollback;
