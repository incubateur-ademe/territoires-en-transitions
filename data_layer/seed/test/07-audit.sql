-- Ajoute les fonctionnalités pour tester les audits.

-- Copie la table des audits.
create table test.audit
as
select *
from labellisation.audit;
comment on table test.audit is
    'Copie de la table audit.';

-- Copie la table des auditeurs.
create table test.audit_auditeur
as
select *
from public.audit_auditeur;
comment on table test.audit_auditeur is
    'Copie de la table auditeurs.';

-- Copie la table des états des actions de l'audit
create table test.action_audit_state
as
select *
from labellisation.action_audit_state;
comment on table test.action_audit_state is
    'Copie de la table action_audit_state.';

-- Copie les demandes
create table test.demande
as
select *
from labellisation.demande;
comment on table test.demande is
    'Copie de la table labellisation.demande.';

create function
    test_reset_audit()
    returns void
as
$$
    -- Vide les tables des audits
truncate labellisation.action_audit_state;
truncate audit_auditeur;
truncate labellisation.audit cascade;
truncate labellisation.demande cascade;

    -- Restaure les audits
insert into labellisation.audit
select *
from test.audit;

    -- Restaure les auditeurs
insert into public.audit_auditeur
select *
from test.audit_auditeur;

    -- Restaure les états des actions de l'audit
insert into labellisation.action_audit_state
select *
from test.action_audit_state;

    -- Restaure les demandes
insert into labellisation.demande
select *
from test.demande;

$$ language sql security definer;
comment on function test_reset_audit is
    'Reinitialise les audits.';
