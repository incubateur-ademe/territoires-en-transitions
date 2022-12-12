begin;
select plan(3);

truncate action_statut;
truncate client_scores;
truncate historique.action_statut;
truncate audit cascade;

create temporary table statut_sequence
(
    collectivite_id     integer    not null,
    action_id           action_id  not null,
    avancement          avancement not null,
    avancement_detaille numeric[] default null,
    concerne            boolean   default true
) on commit drop;

create function
    insert_sequence()
    returns void
begin
    atomic
    insert into action_statut (collectivite_id, action_id, avancement, avancement_detaille, concerne)
    select s.*
    from statut_sequence s
    on conflict (collectivite_id, action_id) do update set avancement = excluded.avancement;
end;

select test.identify_as('yolo@dodo.com');

insert into statut_sequence
values (2, 'eci_1.1.1.1', 'fait', null),
       (2, 'eci_1.1.2.1', 'programme', null),
       (2, 'eci_1.1.3.1', 'pas_fait', null),
       (2, 'eci_1.1.4.1', 'detaille', '{0.2, 0.7, 0.1}');

select insert_sequence();

-- plutôt que d'avancer dans le temps on recule les statuts 1 mois dans le passé.
update historique.action_statut
set modified_at = now() - interval '1 month';

select bag_eq(
               $have$select collectivite_id, action_id, avancement, avancement_detaille from historique.action_statuts_at( 2,'eci', now());$have$,
               $want$select collectivite_id, action_id, avancement, avancement_detaille from statut_sequence fss;$want$,
               'La fonction action_statuts_at devrait renvoyer la sequence.'
           );

-- on crée un audit une semaine dans le passé
insert into audit(id, collectivite_id, referentiel, date_debut)
values (1, 2, 'eci', now() - interval '1 week');

-- on y assigne un auditeur
insert into audit_auditeur (audit_id, auditeur)
values (1, '5f407fc6-3634-45ff-a988-301e9088096a');
--- puis en temps qu'auditeur
select test.identify_as('5f407fc6-3634-45ff-a988-301e9088096a'::uuid);
--- on insert de nouveaux statuts.
select *
into temporary first_statut_sequence
from statut_sequence;
truncate statut_sequence;
insert into statut_sequence
values (2, 'eci_1.1.1.1', 'programme', null),
       (2, 'eci_1.1.2.1', 'fait', null),
       (2, 'eci_1.1.4.1', 'pas_fait', null);
select insert_sequence();


-- on vérifie que la fonction des statuts historiques
select bag_eq(
               $have$select collectivite_id, action_id, avancement, avancement_detaille from historique.action_statuts_at( 2,'eci',now() - interval '1 week');$have$,
               $want$select collectivite_id, action_id, avancement, avancement_detaille from first_statut_sequence fss;$want$,
               'La fonction action_statuts_at devrait renvoyer la première sequence.'
           );

select bag_eq(
               $have$select action_id, avancement from historique.action_statuts_at( 2,'eci',now() + interval '1 week');$have$,
               $want$select f.action_id, coalesce(s.avancement, f.avancement) from first_statut_sequence f left join statut_sequence s using (action_id);$want$,
               'La fonction action_statuts_at devrait renvoyer les derniers éléments des sequences.'
           );

rollback;
