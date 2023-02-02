begin;

select plan(2);

select test.identify_as_service_role();
select ok(
               (select nb_collectivite = 6 from retool_user_collectivites_list where email = 'yala@dada.com'),
               'Yala Dada devrait avoir les droits sur 6 collectivités'
           );
update private_utilisateur_droit
    set active = false
where private_utilisateur_droit.collectivite_id = 10;
select ok(
               (select nb_collectivite = 5 from retool_user_collectivites_list where email = 'yala@dada.com'),
               'Yala Dada devrait avoir les droits sur 5 collectivités'
           );


rollback;
