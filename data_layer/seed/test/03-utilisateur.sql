create function
    test_attach_user(user_id uuid, collectivite_id integer, niveau niveau_acces)
    returns void
as
$$
insert into private_utilisateur_droit
values (default, user_id, collectivite_id, true, default, default, niveau);
$$ language sql security definer;
comment on function test_attach_user is
    'Rattache un utilisateur à une collectivité donnée.';

create or replace function
    test_create_user(
    user_id uuid,
    prenom text,
    nom text,
    email text
)
    returns void
as
$$
begin
    insert into auth.users
    values ('00000000-0000-0000-0000-000000000000',
            user_id,
            'authenticated',
            'authenticated',
            email,
            '$2a$10$zHta6/ak2n7cONYwYodHJOJ0cmnhyXKUomwX0D4X0j3sQqWfXNs0C',
            now(),
            null,
            '', null,
            '', null,
            '', '', null,
            now(),
            '{
              "provider": "email",
              "providers": [
                "email"
              ]
            }', '{}',
            false,
            now(), now(),
            null, null, '', '', null, default,
            0);

    insert into dcp (user_id, nom, prenom, email)
    values (user_id, nom, prenom, email);
    update utilisateur_verifie set verifie = true where utilisateur_verifie.user_id = test_create_user.user_id;
end;
$$ language plpgsql security definer;
comment on function test_create_user is
    'Crée un nouvel utilisateur, ajoute ses DCPs. '
        'Son mot de passe sera `yolododo.`';

create function
    test.random_voyelle()
    returns text
as
$$
select (array [ 'a', 'e', 'i','o', 'u', 'y'])[floor(random() * 6 + 1)]::text;
$$ language sql;

create function
    test_add_random_user(
    in collectivite_id integer default null,
    in niveau niveau_acces default 'edition'::niveau_acces,
    in cgu_acceptees boolean default true,
    out user_id uuid,
    out prenom text,
    out nom text,
    out email text,
    out password text
)
as
$$
declare
    user_count integer;
declare
    new_user_id alias for user_id;
begin
    select gen_random_uuid() into user_id;

    select 'Y' || test.random_voyelle() || 'l' || test.random_voyelle() into prenom;
    select 'D' || test.random_voyelle() || 'd' || test.random_voyelle() into nom;
    select count(*) from auth.users into user_count; -- pour être certain que le mail est unique
    select lower(prenom || '_' || user_count || '@' || nom || '.fr') into email;
    select 'yolododo' into password;

    perform test_create_user(new_user_id, prenom, nom, email);

    if collectivite_id is not null
    then
        perform test_attach_user(new_user_id, collectivite_id, niveau);
    end if;

    if cgu_acceptees
    then
        update dcp
            set cgu_acceptees_le = now()
            where dcp.user_id = new_user_id;
    end if;
end;
$$ language plpgsql security definer;
comment on function test_add_random_user is
    'Rattache un utilisateur généré à une collectivité avec un niveau d''accès. Renvoie son id.';


create function
    test.identify_as(user_id uuid)
    returns void
as
$$
select set_config('request.jwt.claim.sub', user_id::text, true);
select set_config('request.jwt.claim.role', 'authenticated', true);
$$ language sql;
comment on function test.identify_as(uuid) is
    'Change le résultat de la fonction `auth.uid()` pour les tests pgTAP.';

create function
    test.identify_as(email text)
    returns void
as
$$
select test.identify_as(u.id)
from auth.users u
where u.email = identify_as.email;
$$ language sql;
comment on function test.identify_as(text) is
    'Utilise l''adresse mail d''un utilisateur existant et change le résultat de la fonction `auth.uid()` pour les tests pgTAP.';


create function
    test.identify_as_service_role()
    returns void
as
$$
select set_config('request.jwt.claim.sub', null, true);
select set_config('request.jwt.claim.role', 'service_role', true);
$$ language sql;
comment on function test.identify_as_service_role() is
    'Change le résultat de la fonction `auth.uid()` pour les tests pgTAP.';

create function
    test_remove_user(email text)
    returns void
as
$$
declare
    found_id uuid;
begin
    select id into found_id from auth.users u where u.email = test_remove_user.email;

    if found_id is not null
    then
        delete
        from private_utilisateur_droit pud
        where pud.user_id = found_id;

        delete
        from dcp
        where dcp.user_id = found_id;

        delete
        from auth.users u
        where u.email = test_remove_user.email;
    else
        perform set_config('response.status', '404', true);
    end if;
end;
$$ language plpgsql security definer;
comment on function test_remove_user is
    'Supprime un utilisateur et ses droits.';
