-- Ajoute les fonctionnalités pour tester les discussions.

-- Copie la table des discussions.
create table test.action_discussion
as
select *
from public.action_discussion;
comment on table test.action_discussion is
    'Copie de la table action_discussion.';

-- Copie la table des commentaires.
create table test.action_discussion_commentaire
as
select *
from public.action_discussion_commentaire;
comment on table test.action_discussion_commentaire is
    'Copie de la table action_discussion_commentaire.';


create function
    test_reset_discussion_et_commentaires()
    returns void
as
$$
    -- Vide la table des commentaires et discussions
    truncate action_discussion_commentaire;
    truncate action_discussion cascade;

    -- Restaure les discussions
    insert into public.action_discussion
    select *
    from test.action_discussion;

    -- Restaure les commentaires
    insert into public.action_discussion_commentaire
    select *
    from test.action_discussion_commentaire;
$$ language sql security definer;
comment on function test_reset_discussion_et_commentaires is
    'Reinitialise les discussions et leurs commentaires.';

