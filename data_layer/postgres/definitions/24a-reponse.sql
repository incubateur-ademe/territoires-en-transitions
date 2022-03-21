create table reponse_choix
(
    collectivite_id integer references collectivite not null,
    question_id question_id references question not null,
    reponse     choix_id  references question_choix not null,
    primary key (collectivite_id, question_id)
);
comment on table reponse_choix is
    'Réponses saisies par la collectivité aux questions de type choix';


create table reponse_binaire
(
    collectivite_id integer references collectivite not null,
    question_id     question_id references question not null,
    reponse         boolean not null,
    primary key (collectivite_id, question_id)
);
comment on table reponse_choix is
    'Réponses saisies par la collectivité aux questions de type binaire';

create table reponse_proportion
(
    collectivite_id integer references collectivite not null,
    question_id     question_id references question not null,
    reponse         float not null,
    primary key (collectivite_id, question_id)
);
comment on table reponse_choix is
    'Réponses saisies par la collectivité aux questions de type proportion';


-- Row level SECURITY
alter table reponse_choix
  enable row level security;

create policy allow_read
    on reponse_choix
    for select
    using (is_authenticated());

create policy allow_insert
    on reponse_choix
    for insert
    with check (is_any_role_on(collectivite_id));
--
alter table reponse_binaire
  enable row level security;

create policy allow_read
    on reponse_binaire
    for select
    using (is_authenticated());

create policy allow_insert
    on reponse_binaire
    for insert
    with check (is_any_role_on(collectivite_id));

--
alter table reponse_proportion
  enable row level security;

create policy allow_read
    on reponse_proportion
    for select
    using (is_authenticated());

create policy allow_insert
    on reponse_proportion
    for insert
    with check (is_any_role_on(collectivite_id));