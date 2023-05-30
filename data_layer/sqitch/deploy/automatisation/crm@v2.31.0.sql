-- Deploy tet:utils/automatisation to pg

BEGIN;
alter type automatisation.automatisation_type
    add value if not exists 'plan_action_insert';
alter type automatisation.automatisation_type
    add value if not exists 'collectivite_utilisateur_delete';

-- Vue activite collectivite sur plan d'action
create view automatisation.collectivite_plan_action as
select c.collectivite_id,
       c.nom ,
       c.code_siren_insee,
       count(distinct a) as nb_axes,
       count(distinct f) as nb_fiches,
       max(dcp.email),
       concat('https://app.territoiresentransitions.fr/collectivite/', c.collectivite_id, '/plans') as lien_plateforme
from collectivite_card c
         left join axe a on c.collectivite_id = a.collectivite_id
         left join fiche_action f on c.collectivite_id = f.collectivite_id
         left join dcp on a.modified_by = dcp.user_id or f.modified_by = dcp.user_id
group by c.collectivite_id, c.nom, c.code_siren_insee;

-- Envoie les informations de la collectivité qui test pour la première fois les plans d'actions à n8n
create or replace function automatisation.send_collectivite_plan_action_json_n8n() returns trigger as $$
declare
    to_send jsonb;
    uri text;
    rec automatisation.collectivite_plan_action;
begin
    select c.*
    from automatisation.collectivite_plan_action c
    where c.collectivite_id = new.collectivite_id
    limit 1 into rec;
    if (rec.nb_fiches = 0 and rec.nb_axes = 1) or (rec.nb_fiches=1 and rec.nb_axes = 0) then
        to_send = to_jsonb((select jsonb_build_array(rec)));
        uri = (select au.uri from automatisation.automatisation_uri au where au.uri_type = 'plan_action_insert' limit 1);
        if uri is not null then
            perform net.http_post(
                    uri,
                    to_send
                );
        end if;
    end if;
    return new;
exception
    when others then return new;
end;
$$ language plpgsql security definer;
comment on function automatisation.send_collectivite_plan_action_json_n8n is
    'Envoie les informations de la collectivité qui test pour la première fois les plans d''actions à n8n';

-- Envoie l'information qu'une collectivité est devenu inactive suite à la suppression de tous ses utilisateurs
create or replace function automatisation.send_delete_collectivite_membre_json_n8n() returns trigger as $$
declare
    to_send jsonb;
    uri text;
begin
    if (select count(p.*)=0 from private_utilisateur_droit p where p.collectivite_id = old.collectivite_id) then
        to_send = to_jsonb((select jsonb_build_array(c.*)
                            from collectivite_card c
                              where c.collectivite_id =old.collectivite_id));
        uri = (select au.uri from automatisation.automatisation_uri au where au.uri_type = 'collectivite_utilisateur_delete' limit 1);
        if uri is not null then
            perform net.http_post(
                    uri,
                    to_send
                );
        end if;
    end if;
    return old;
exception
    when others then return old;
end;
$$ language plpgsql security definer;
comment on function automatisation.send_delete_collectivite_membre_json_n8n is
    'Envoie l''information qu''une collectivité est devenu inactive suite à la suppression de tous ses utilisateurs';

-- Trigger sur la table axe
create trigger axe_insert_automatisation
    after insert
    on axe
    for each row
execute procedure automatisation.send_collectivite_plan_action_json_n8n();

-- Trigger sur la table fiche_action
create trigger fiche_action_insert_automatisation
    after insert
    on fiche_action
    for each row
execute procedure automatisation.send_collectivite_plan_action_json_n8n();

-- Trigger sur la table private_utilisateur_droit
create trigger utilisateur_droit_delete_automatisation
    after delete
    on private_utilisateur_droit
    for each row
execute procedure automatisation.send_delete_collectivite_membre_json_n8n();

COMMIT;
