-- Deploy tet:utilisateur/referent_contacts to pg
-- requires: utilisateur/droits

BEGIN;

create function referent_contacts(id integer)
    returns table
            (
                prenom text,
                nom    text,
                email  text
            )
as
$$
select p.prenom, p.nom, p.email
from private_utilisateur_droit d
         join dcp p on p.user_id = d.user_id
where d.collectivite_id = referent_contacts.id
  and d.active
  and role_name = 'referent'
$$ language sql security definer;
comment on function referent_contacts is
    'Returns the contact information of the all referents of a collectivite given the id.';

COMMIT;
