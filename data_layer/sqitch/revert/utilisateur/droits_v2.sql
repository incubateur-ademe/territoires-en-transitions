-- Revert tet:utilisateur/droits_v2 from pg

BEGIN;

create or replace function
    is_any_role_on(id integer)
    returns boolean
as
$$
select count(*) > 0
from private_utilisateur_droit
where private_utilisateur_droit.collectivite_id = is_any_role_on.id
  and private_utilisateur_droit.user_id = auth.uid()
  and active
$$ language sql;


-- update RLS
alter policy allow_insert
    on reponse_choix
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on reponse_choix
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on reponse_binaire
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on reponse_binaire
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on reponse_proportion
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on reponse_proportion
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_personnalise_definition
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_personnalise_definition
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_personnalise_resultat
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_personnalise_resultat
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_personnalise_objectif
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_personnalise_objectif
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_resultat
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_resultat
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_objectif
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_objectif
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on indicateur_commentaire
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on indicateur_commentaire
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on fiche_action
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on fiche_action
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on plan_action
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on plan_action
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on action_commentaire
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on action_commentaire
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on action_statut
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on action_statut
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on preuve_lien
    with check (is_any_role_on(collectivite_id));

alter policy allow_update
    on preuve_lien
    using (is_any_role_on(collectivite_id));

alter policy allow_delete
    on preuve_lien
    using (is_any_role_on(collectivite_id));

alter policy allow_read
    on private_collectivite_invitation
    using (is_any_role_on(collectivite_id));

alter policy allow_insert
    on private_collectivite_invitation
    with check (is_any_role_on(collectivite_id));


create or replace function
    is_bucket_writer(id text)
    returns boolean
as
$$
select count(*) > 0
from collectivite_bucket cb
where is_any_role_on(cb.collectivite_id)
  and cb.bucket_id = is_bucket_writer.id
$$ language sql;
comment on function is_bucket_writer is
    'Returns true if current user can write on a bucket id';

drop function have_lecture_acces(id integer);
drop function have_edition_acces(id integer);
drop function have_admin_acces(id integer);
drop function have_one_of_niveaux_acces(niveaux niveau_acces[], id integer);

COMMIT;
