-- Ajoute les fonctionnalités pour tester les discussions.

-- Copie la table des discussions.
create table test.discussion
as
select *
from public.discussion;
comment on table test.discussion is
    'Copie de la table discussion.';

-- Copie la table des commentaires.
create table test.discussion_message
as
select *
from public.discussion_message;
comment on table test.discussion_message is
    'Copie de la table discussion_message.';


create function
    test_reset_discussion_et_commentaires()
    returns void
as
$$
    -- Vide la table des commentaires et discussions
    truncate discussion_message;
    truncate discussion cascade;

    -- Restaure les discussions
    insert into public.discussion
    select *
    from test.discussion;

    -- Restaure les commentaires
    insert into public.discussion_message
    select *
    from test.discussion_message;
$$ language sql security definer;
comment on function test_reset_discussion_et_commentaires is
    'Reinitialise les discussions et leurs commentaires.';

