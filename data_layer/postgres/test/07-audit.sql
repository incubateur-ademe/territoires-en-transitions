-- Ajoute les fonctionnalités pour tester les audits.

-- Copie la table des audits.
create table test.audit
as
select *
from public.audit;
comment on table test.audit is
    'Copie de la table audit.';

-- Copie la table des états des actions de l'audit
create table test.action_audit_state
as
select *
from labellisation.action_audit_state;
comment on table test.action_audit_state is
    'Copie de la table action_audit_state.';


create function
    test_reset_audit()
    returns void
as
$$
    -- Vide la table des commentaires et discussions
truncate labellisation.action_audit_state;
truncate audit cascade;

    -- Restaure les audits
insert into public.audit
select *
from test.audit;

    -- Restaure les états des actions de l'audit
insert into labellisation.action_audit_state
select *
from test.action_audit_state;
$$ language sql security definer;
comment on function test_reset_audit is
    'Reinitialise les audits.';