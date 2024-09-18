-- Deploy tet:taxonomie/thematique to pg


BEGIN;

-- On doit supprimer et recréer ces fonctions car le type de la colonne va etre change
drop function thematique(action_impact_state);
drop function collectivite_thematique(public.collectivite);
alter type old_indicateur_thematique add value if not exists 'agriculture_alimentation';
alter table thematique alter column md_id type varchar;

insert into thematique (nom, md_id)
values (
           'Agriculture et alimentation',
           'agriculture_alimentation'
       );

-- recree les fonctions
create function
    thematique(action_impact_state)
    returns setof thematique
    language sql
    stable
begin
    atomic
    select t.*
    from thematique t
             join action_impact_thematique ait on ait.thematique_id = t.id
    where ait.action_impact_id = $1.action.id;
end;
comment on function thematique is
    'La relation entre le state d''une action et ses thématiques.';

CREATE OR REPLACE FUNCTION public.collectivite_thematique(public.collectivite)
    RETURNS SETOF public.thematique
    LANGUAGE SQL
    STABLE
    SECURITY DEFINER
    SET search_path TO ''
BEGIN ATOMIC
    SELECT thematique.*
    FROM public.thematique
    ;
END;


-- remet le cast dans la fonction
-- Trigger json indicateur

create or replace function
    private.upsert_indicateurs_after_json_insert()
    returns trigger
as
$$
declare
    indicateur jsonb;
    id_courant integer;
begin
    for indicateur in select * from jsonb_array_elements(new.indicateurs)
        loop
            insert into indicateur_definition(identifiant_referentiel,
                                              titre,
                                              titre_long,
                                              description,
                                              unite,
                                              participation_score,
                                              sans_valeur_utilisateur,
                                              modified_at)
            values (indicateur ->> 'id',
                    indicateur ->> 'nom',
                    indicateur ->> 'titre_long',
                    indicateur ->> 'description',
                    indicateur ->> 'unite',
                    (indicateur -> 'participation_score')::bool,
                    (indicateur -> 'sans_valeur')::bool,
                    now()
                   )
            on conflict (identifiant_referentiel) do update
                set identifiant_referentiel         = excluded.identifiant_referentiel,
                    titre                 = excluded.titre,
                    titre_long          = excluded.titre_long,
                    description         = excluded.description,
                    unite               = excluded.unite,
                    participation_score = excluded.participation_score,
                    sans_valeur_utilisateur         = excluded.sans_valeur_utilisateur,
                    modified_at         = excluded.modified_at
            returning id into id_courant;

            --- Enlève les tags TeT s'ils existent déjà
            delete
            from indicateur_categorie_tag ict
            where ict.indicateur_id = id_courant
              and ict.categorie_tag_id in (
                                          select id
                                          from categorie_tag
                                          where collectivite_id is null and groupement_id is null);
            --- Met les tags TeT
            -- selection
            if (indicateur -> 'selection')::bool then
                insert into indicateur_categorie_tag (indicateur_id, categorie_tag_id)
                select id_courant, (select id
                                    from categorie_tag
                                    where nom = 'prioritaire'
                                      and collectivite_id is null and groupement_id is null
                                    limit 1);
            end if;
            -- type
            if indicateur -> 'type' != 'null' and (indicateur -> 'type')::text in ('resultat','impact') then
                insert into indicateur_categorie_tag (indicateur_id, categorie_tag_id)
                select id_courant, (select id
                                    from categorie_tag
                                    where nom = (indicateur -> 'type')::text
                                      and collectivite_id is null and groupement_id is null
                                    limit 1);
            end if;
            -- programmes
            if indicateur -> 'programmes' != 'null' then
                insert into indicateur_categorie_tag (indicateur_id, categorie_tag_id)
                select id_courant, (select id
                                    from categorie_tag
                                    where nom = pg::text
                                      and collectivite_id is null and groupement_id is null
                                    limit 1)
                from jsonb_array_elements_text(indicateur -> 'programmes') as pg
                where pg::text in (select nom from categorie_tag where collectivite_id is null);
            end if;

            -- actions
            if indicateur -> 'action_ids' != 'null' then
                --- insert les liens
                insert into indicateur_action (indicateur_id, action_id)
                select id_courant, id::action_id
                from jsonb_array_elements_text(indicateur -> 'action_ids') as id
                on conflict (indicateur_id, action_id) do nothing;
                --- enlève les liens qui n'existent plus
                delete
                from indicateur_action ia
                where ia.indicateur_id = id_courant
                  and ia.action_id not in
                      (select id::action_id from jsonb_array_elements_text(indicateur -> 'action_ids') as id);
            end if;

            -- thematiques
            --- enlève les thématiques déjà existante
            delete
            from indicateur_thematique ia
            where ia.indicateur_id = id_courant;
            if indicateur -> 'thematiques' != 'null' then
                --- insert les nouvelles thématiques
                insert into indicateur_thematique (indicateur_id, thematique_id)
                select id_courant, (select id
                                    from thematique
                                    where md_id = th
                                    limit 1)
                from jsonb_array_elements_text(indicateur -> 'thematiques') as th
                where th in (
                                                       select distinct md_id
                                                       from thematique
                                                       )
                on conflict (indicateur_id, thematique_id) do nothing;
            end if;

            -- Supprime les liens de parentés qu'on recréera dans une autre itération
            delete
            from indicateur_groupe
            where enfant = id_courant;
        end loop;

    -- parent
    for indicateur in select * from jsonb_array_elements(new.indicateurs)
        loop
            if indicateur -> 'parent' != 'null'
                and (select count(*)>0
                     from indicateur_definition
                     where identifiant_referentiel = (indicateur -> 'parent')::text) then
                insert into indicateur_groupe (parent, enfant)
                values ((select id
                         from indicateur_definition
                         where identifiant_referentiel = (indicateur -> 'parent')::text
                         limit 1),
                        (select id
                         from indicateur_definition
                         where identifiant_referentiel = (indicateur -> 'id')::text
                         limit 1));
            end if;
        end loop;

    return new;
end;
$$ language plpgsql;

comment on function private.upsert_indicateurs_after_json_insert() is 'Mets à jour les définitions des indicateurs ansi que les liens avec les actions.';

COMMIT;
