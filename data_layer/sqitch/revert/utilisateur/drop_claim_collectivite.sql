-- Revert tet:utilisateur/drop_claim_collectivite from pg

BEGIN;

create or replace function claim_collectivite(id integer) returns json
as
$$
declare
    collectivite_already_claimed bool;
    claimed_collectivite_id      integer;
begin
    select id into claimed_collectivite_id;

    select claimed_collectivite_id in (select collectivite_id
                                       from private_utilisateur_droit
                                       where active)
    into collectivite_already_claimed;

    if not collectivite_already_claimed
    then
        insert
        into private_utilisateur_droit(user_id, collectivite_id, niveau_acces, active)
        values (auth.uid(), claimed_collectivite_id, 'admin', true);
        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous êtes administrateur de la collectivité.');
    else
        perform set_config('response.status', '409', true);
        return json_build_object('message', 'La collectivité dispose déjà d''un administrateur.');
    end if;
end
$$ language plpgsql security definer;
comment on function claim_collectivite(integer) is
    'Fonction dépréciée pour rejoindre une collectivité.';

create function claim_collectivite(
    collectivite_id integer,
    role membre_fonction,
    poste text,
    champ_intervention referentiel[],
    est_referent boolean
) returns json
    security definer
    language plpgsql
    volatile
as
$$
begin
    if not is_authenticated() then
        perform set_config('response.status', '401', true);
        return json_build_object('message', 'Vous n''êtes pas connecté.');
    end if;

    if not exists (select 1
                   from private_utilisateur_droit pud
                   where pud.active
                     and pud.collectivite_id = $1)
    then
        insert
        into private_utilisateur_droit(user_id, collectivite_id, niveau_acces, active)
        values (auth.uid(), $1, 'admin', true);

        insert
        into private_collectivite_membre(user_id, collectivite_id, fonction, details_fonction, champ_intervention, est_referent)
        values (auth.uid(), $1, $2, $3, $4, $5);

        perform set_config('response.status', '200', true);
        return json_build_object('message', 'Vous êtes administrateur de la collectivité.');
    else
        perform set_config('response.status', '409', true);
        return json_build_object('message', 'La collectivité dispose déjà d''un administrateur.');
    end if;
end
$$;
comment on function claim_collectivite(integer, membre_fonction, text, referentiel[], est_referent boolean) is
    'Permet à l''utilisateur de rejoindre une collectivité sans utilisateur.';

COMMIT;
