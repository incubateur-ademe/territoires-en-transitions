-- Deploy tet:panier_action_impact/panier to pg

BEGIN;

create table panier
(
    id                  uuid                            default gen_random_uuid() primary key,
    created_at          timestamptz                     default current_timestamp not null,
    created_by          uuid references auth.users      default null,
    collectivite_id     integer references collectivite default null,
    collectivite_preset integer references collectivite default null,
    latest_update       timestamptz                     default current_timestamp not null,
    private             bool generated always as ( collectivite_id is not null ) stored,
    unique (collectivite_id)
);
comment on table panier is
    'Panier d''action à impact.';
comment on column panier.latest_update is
    'La dernière mise à jour du panier ou de son contenu.';
comment on column panier.collectivite_id is
    'La collectivité à laquelle ce panier appartient. '
        'Si non null, c''est un panier officiel crée depuis l''app *par* la collectivité.';
comment on column panier.collectivite_preset is
    'La préselection du filtre de collectivité. '
        'Permet de filtrer les actions avec les compétences d''une collectivité .';
comment on column panier.private is
    'Vrai si le panier à été crée *par* une collectivité.';

-- permet d'écouter la table panier
alter publication supabase_realtime add table panier;

-- RLS
alter table panier
    enable row level security;
create policy allow_read
    on panier
    for select
    to anon, authenticated
    using (true);
create policy allow_update
    on panier
    for update
    to anon, authenticated
    using (true);

create table action_impact_panier
(
    panier uuid references panier           not null,
    action integer references action_impact not null,
    primary key (panier, action)
);
comment on table action_impact_panier is
    'Une action dans son panier. '
        'On ajoute et on retire les actions du panier à partir de cette table.';


create table action_impact_categorie
(
    id  text primary key,
    nom text not null
);
comment on table action_impact_categorie is
    'La catégorie que l''on peut assigner à une action dans un panier.';
insert into action_impact_categorie (id, nom)
values ('non_pertinent', 'Non pertinent'),
       ('en_cours', 'En cours'),
       ('realise', 'Réalisé');
alter table action_impact_categorie
    enable row level security;
create policy allow_read on
    action_impact_categorie for select using (true);


create table action_impact_statut
(
    panier    uuid references panier                  not null,
    categorie text references action_impact_categorie not null,
    action    integer references action_impact        not null,
    primary key (panier, action)
);
comment on table action_impact_statut is
    'Le statut d''une action dans un panier, ex "En cours". '
        'On sert de cette table pour assigner et retirer la catégorie d''une action dans un panier.';


create function
    panier_from_landing()
    returns panier
    language sql
    volatile
    security definer
begin
    atomic
    insert into panier (collectivite_id, collectivite_preset)
    values (null, null)
    returning *;
end;
comment on function panier_from_landing is
    'Crée un nouveau panier.';

create function
    panier_from_landing(collectivite_id integer)
    returns panier
    language plpgsql
    volatile
    security definer
as
$$
declare
    found panier;
begin
    select *
    from panier p
    where p.collectivite_preset = panier_from_landing.collectivite_id
      and p.collectivite_id is null
      and p.created_at > current_timestamp - interval '1 month'
    into found;

    raise notice 'found %', found;

    if found is null
    then
        insert into panier (collectivite_id, collectivite_preset)
        values (null, $1)
        returning * into found;
    end if;

    return found;
end
$$;
comment on function panier_from_landing(integer) is
    'Un panier récent avec une collectivité présélectionnée.';

create function
    panier_of_collectivite(collectivite_id integer)
    returns panier
    language plpgsql
    volatile
    security definer
as
$$
declare
    found panier;
begin
    if not can_read_acces_restreint($1)
    then
        perform set_config('response.status', '403', true);
        return null;
    end if;

    select * from panier p where p.collectivite_id = $1 into found;
    if found is null
    then
        insert into panier (collectivite_id, collectivite_preset)
        values ($1, $1)
        returning * into found;
    end if;
    return found;
end
$$;
comment on function panier_of_collectivite(integer) is
    'Le panier d''action "officiel" d''une collectivité.';

create function panier_change_latest_update() returns trigger as
$$
begin
    if new is not null
    then
        update panier aip
        set latest_update = current_timestamp
        where aip.id = new.panier;
        return new;
    elseif old is not null
    then
        update panier aip
        set latest_update = current_timestamp
        where aip.id = old.panier;
        return old;
    end if;
end
$$ language plpgsql;

create trigger on_change_update_panier
    after update or insert or delete
    on action_impact_panier
    for each row
execute procedure panier_change_latest_update();
comment on trigger on_change_update_panier on action_impact_panier is
    'Mets à jour la propriété `latest_update` du panier pour notifier le client.';

create trigger on_change_update_panier
    after update or insert or delete
    on action_impact_statut
    for each row
execute procedure panier_change_latest_update();
comment on trigger on_change_update_panier on action_impact_statut is
    'Mets à jour la propriété `latest_update` du panier pour notifier le client.';

create function panier_set_latest_update() returns trigger as
$$
begin
    new.latest_update = current_timestamp;
    return new;
end
$$ language plpgsql;

create trigger on_change_set_latest_update
    before update
    on panier
    for each row
execute procedure panier_set_latest_update();
comment on trigger on_change_set_latest_update on panier is
    'Mets à jour la propriété `latest_update` à chaque modification.';


create table action_impact_state
(
    action     action_impact,
    statut     action_impact_statut,
    isInPanier bool
);
alter table action_impact_state
    enable row level security;
comment on table action_impact_state is
    'L''état d''une action par rapport à un panier. '
        'On ne se sert pas de cette table pour stocker des données.';

create function
    action_impact_state(panier)
    returns setof action_impact_state
    language sql
    stable
begin
    atomic
    select a               as action,
           ais             as statut,
           aip is not null as isInPanier
    from action_impact a
             left join action_impact_panier aip
                       on aip.action = a.id and aip.panier = $1.id
             left join action_impact_statut ais
                       on ais.action = a.id and ais.panier = $1.id;
end;
comment on function action_impact_state is
    'La liste des actions et de leurs états pour un panier.';

COMMIT;
