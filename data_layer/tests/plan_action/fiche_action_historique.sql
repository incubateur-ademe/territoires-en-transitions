begin;
select plan(4);

-- Repro du bug d'historisation de `fiche_action.modified_by`.
--
-- Le backend tRPC met à jour les fiches via une connexion service_role :
-- `auth.uid()` y vaut NULL alors que `modified_by` est explicitement écrit
-- avec l'id de l'utilisateur applicatif (cf. update-fiche.service.ts).
--
-- La fonction `historique.save_fiche_action()` insère `auth.uid()` au lieu
-- de `new.modified_by` dans la branche INSERT (premier changement après >1h).
-- Conséquence observée en prod : `public.fiche_action.modified_by` est correct
-- mais `historique.fiche_action.modified_by` est NULL.

create temp table test_fiche (id integer) on commit drop;

-- On part d'un état d'historique propre pour la fiche testée.
delete from historique.fiche_action_pilote;
delete from historique.fiche_action;

-- Cas 1 — INSERT d'une nouvelle fiche par le backend (service_role)
-- avec un `modified_by` explicite.
select test.identify_as_service_role();

with inserted as (
    insert into fiche_action (titre, collectivite_id, modified_by, modified_at)
    values ('Fiche test historisation - insert',
            1,
            '3f407fc6-3634-45ff-a988-301e9088096a', -- yili@didi.com
            now())
    returning id
)
insert into test_fiche (id) select id from inserted;

select is(
    (select modified_by from fiche_action where id = (select id from test_fiche)),
    '3f407fc6-3634-45ff-a988-301e9088096a'::uuid,
    'public.fiche_action.modified_by reflète bien l''id écrit par le backend'
);

select is(
    (select modified_by
       from historique.fiche_action
      where fiche_id = (select id from test_fiche)
      order by modified_at desc
      limit 1),
    '3f407fc6-3634-45ff-a988-301e9088096a'::uuid,
    'historique.fiche_action.modified_by doit refléter le modified_by écrit '
    'sur la fiche, pas auth.uid() (cf. save_fiche_action() ligne 152)'
);

-- Cas 2 — UPDATE après >1h, qui retombe dans la branche INSERT
-- de `historique.save_fiche_action()` (debounce expiré).
-- On simule le passage du temps en reculant le `modified_at` de l'historique.
update historique.fiche_action
   set modified_at = now() - interval '2 hours'
 where fiche_id = (select id from test_fiche);

update fiche_action
   set titre = 'Fiche test historisation - update',
       modified_by = '17440546-f389-4d4f-bfdb-b0c94a1bd0f9', -- yolo@dodo.com
       modified_at = now()
 where id = (select id from test_fiche);

select is(
    (select modified_by from fiche_action where id = (select id from test_fiche)),
    '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid,
    'public.fiche_action.modified_by est bien mis à jour par l''update backend'
);

select is(
    (select modified_by
       from historique.fiche_action
      where fiche_id = (select id from test_fiche)
      order by modified_at desc
      limit 1),
    '17440546-f389-4d4f-bfdb-b0c94a1bd0f9'::uuid,
    'historique.fiche_action.modified_by doit refléter le modified_by de la '
    'modif courante, même quand on retombe dans la branche INSERT (>1h)'
);

select * from finish();
rollback;
