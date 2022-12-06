begin;

select plan(5);
select isnt_empty(
               'select * from evaluation.service_configuration',
               'Le service des scores devrait être configuré par défaut.'
           );

select isnt_empty(
               'select * from evaluation.service_referentiel',
               'La vue matérialisée `evaluation.service_referentiel` ne devrait pas être vide.'
           );


select isnt_empty(
               'select * from client_scores where collectivite_id = 10;',
               'Les scores de la collectivité #10 devraient être présents.'
           );

select isnt_empty(
               'select * from pre_audit_scores where collectivite_id = 10;',
               'Les scores pre-audit de la collectivité #10 devraient être présents.'
           );

select isnt_empty(
               'select * from comparaison_scores_audit csa where collectivite_id = 10;',
               'La vue `comparaison_scores_audit` de la collectivité #10 ne devrait pas être vide.'
           );

rollback;
