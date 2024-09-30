-- Deploy tet:plan_action/fiches to pg

BEGIN;

-- Ajout données résultats attendus dans effets attendus
insert into fiche_action_effet_attendu
select f.id, ea.id
from (
     select id, unnest(resultats_attendus) as resultat
     from fiche_action
     where resultats_attendus is not null
     ) f
left join effet_attendu ea on case
                                  when trim(f.resultat::text) = 'Allongement de la durée d’usage' then
                                      trim(ea.nom) = 'Allongement de la durée d''usage'
                                  when f.resultat = 'Amélioration de la qualité de vie' then
                                      trim(ea.nom) = 'Amélioration du cadre de vie'
                                  when f.resultat = 'Efficacité énergétique' then
                                      trim(ea.nom) = 'Réduction des consommations énergétiques' -- TODO attente vérification
                                  when f.resultat = 'Sobriété énergétique' then
                                      trim(ea.nom) = 'Sobriété'
                                  else
                                      trim(resultat::text) ilike trim(ea.nom)
                              end;

drop function plan_action_export;

drop trigger upsert on fiches_action;
drop function upsert_fiche_action();
drop view fiches_action;

create or replace view fiches_action
as
SELECT fa.modified_at,
       fa.id,
       fa.titre,
       fa.description,
       fa.piliers_eci,
       fa.objectifs,
       (select array_agg(ea.nom)
        from fiche_action_effet_attendu faea
        join effet_attendu ea on faea.effet_attendu_id = ea.id
        where faea.fiche_id = fa.id
        ) as resultats_attendus,
       fa.cibles,
       fa.ressources,
       fa.financements,
       fa.budget_previsionnel,
       fa.statut,
       fa.niveau_priorite,
       fa.date_debut,
       fa.date_fin_provisoire,
       fa.amelioration_continue,
       fa.calendrier,
       fa.notes_complementaires,
       fa.maj_termine,
       fa.collectivite_id,
       fa.created_at,
       fa.modified_by,
       t.thematiques,
       st.sous_thematiques,
       p.partenaires,
       s.structures,
       (
       SELECT array_agg(ROW (pil.nom, pil.collectivite_id, pil.tag_id, pil.user_id)::personne) AS array_agg
       FROM (
            SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                   pt.collectivite_id,
                   fap.tag_id,
                   fap.user_id
            FROM fiche_action_pilote fap
            LEFT JOIN personne_tag pt ON fap.tag_id = pt.id
            LEFT JOIN dcp ON fap.user_id = dcp.user_id
            WHERE fap.fiche_id = fa.id
            ) pil
       ) AS pilotes,
       (
       SELECT array_agg(ROW (ref.nom, ref.collectivite_id, ref.tag_id, ref.user_id)::personne) AS array_agg
       FROM (
            SELECT COALESCE(pt.nom, concat(dcp.prenom, ' ', dcp.nom)) AS nom,
                   pt.collectivite_id,
                   far.tag_id,
                   far.user_id
            FROM fiche_action_referent far
            LEFT JOIN personne_tag pt ON far.tag_id = pt.id
            LEFT JOIN dcp ON far.user_id = dcp.user_id
            WHERE far.fiche_id = fa.id
            ) ref
       ) AS referents,
       pla.axes,
       act.actions,
       (
       SELECT array_agg(ROW (indi.id, indi.groupement_id, indi.collectivite_id, indi.identifiant_referentiel, indi.titre, indi.titre_long, indi.description, indi.unite, indi.borne_min, indi.borne_max, indi.participation_score, indi.sans_valeur_utilisateur, indi.valeur_calcule, indi.modified_at, indi.created_at, indi.modified_by, indi.created_by)::indicateur_definition) AS array_agg
       FROM (
            SELECT id.id,
                   id.groupement_id,
                   id.collectivite_id,
                   id.identifiant_referentiel,
                   id.titre,
                   id.titre_long,
                   id.description,
                   id.unite,
                   id.borne_min,
                   id.borne_max,
                   id.participation_score,
                   id.sans_valeur_utilisateur,
                   id.valeur_calcule,
                   id.modified_at,
                   id.created_at,
                   id.modified_by,
                   id.created_by
            FROM fiche_action_indicateur fai
            JOIN indicateur_definition id ON fai.indicateur_id::text = id.id::text
            WHERE fai.fiche_id = fa.id
            ) indi
       ) AS indicateurs,
       ser.services,
       (
       SELECT array_agg(ROW (fin.financeur_tag, fin.montant_ttc, fin.id)::financeur_montant) AS financeurs
       FROM (
            SELECT ft.*::financeur_tag AS financeur_tag,
                   faft.montant_ttc,
                   faft.id
            FROM financeur_tag ft
            JOIN fiche_action_financeur_tag faft ON ft.id = faft.financeur_tag_id
            WHERE faft.fiche_id = fa.id
            ) fin
       ) AS financeurs,
       fic.fiches_liees,
       fa.restreint
FROM fiche_action fa
LEFT JOIN (
          SELECT fath.fiche_id,
                 array_agg(th.*) AS thematiques
          FROM thematique th
          JOIN fiche_action_thematique fath ON fath.thematique_id = th.id
          GROUP BY fath.fiche_id
          ) t ON t.fiche_id = fa.id
LEFT JOIN (
          SELECT fasth.fiche_id,
                 array_agg(sth.*) AS sous_thematiques
          FROM sous_thematique sth
          JOIN fiche_action_sous_thematique fasth ON fasth.thematique_id = sth.id
          GROUP BY fasth.fiche_id
          ) st ON st.fiche_id = fa.id
LEFT JOIN (
          SELECT fapt.fiche_id,
                 array_agg(pt.*) AS partenaires
          FROM partenaire_tag pt
          JOIN fiche_action_partenaire_tag fapt ON fapt.partenaire_tag_id = pt.id
          GROUP BY fapt.fiche_id
          ) p ON p.fiche_id = fa.id
LEFT JOIN (
          SELECT fast.fiche_id,
                 array_agg(st_1.*) AS structures
          FROM structure_tag st_1
          JOIN fiche_action_structure_tag fast ON fast.structure_tag_id = st_1.id
          GROUP BY fast.fiche_id
          ) s ON s.fiche_id = fa.id
LEFT JOIN (
          SELECT fapa.fiche_id,
                 array_agg(pa.*) AS axes
          FROM axe pa
          JOIN fiche_action_axe fapa ON fapa.axe_id = pa.id
          GROUP BY fapa.fiche_id
          ) pla ON pla.fiche_id = fa.id
LEFT JOIN (
          SELECT faa.fiche_id,
                 array_agg(ar.*) AS actions
          FROM action_relation ar
          JOIN fiche_action_action faa ON faa.action_id::text = ar.id::text
          GROUP BY faa.fiche_id
          ) act ON act.fiche_id = fa.id
LEFT JOIN (
          SELECT fast.fiche_id,
                 array_agg(st_1.*) AS services
          FROM service_tag st_1
          JOIN fiche_action_service_tag fast ON fast.service_tag_id = st_1.id
          GROUP BY fast.fiche_id
          ) ser ON ser.fiche_id = fa.id
LEFT JOIN (
          SELECT falpf.fiche_id,
                 array_agg(fr.*) AS fiches_liees
          FROM private.fiche_resume fr
          JOIN fiches_liees_par_fiche falpf ON falpf.fiche_liee_id = fr.id
          GROUP BY falpf.fiche_id
          ) fic ON fic.fiche_id = fa.id;

create or replace function upsert_fiche_action() returns trigger
    security definer
    language plpgsql
as
$$
declare
    id_fiche        integer;
    thematique      thematique;
    sous_thematique sous_thematique;
    axe             axe;
    partenaire      partenaire_tag;
    structure       structure_tag;
    pilote          personne;
    referent        personne;
    action          action_relation;
    indicateur      indicateur_definition;
    service         service_tag;
    financeur       financeur_montant;
    fiche_liee      fiche_resume;
    effet_attendu   text;
begin
    id_fiche = new.id;
    if not have_edition_acces(new.collectivite_id) and not is_service_role() then
        perform set_config('response.status', '401', true);
        raise 'Modification non autorisé.';
    end if;
    -- Fiche action
    if id_fiche is null then
        insert into fiche_action (titre,
                                  description,
                                  piliers_eci,
                                  objectifs,
                                  cibles,
                                  ressources,
                                  financements,
                                  budget_previsionnel,
                                  statut,
                                  niveau_priorite,
                                  date_debut,
                                  date_fin_provisoire,
                                  amelioration_continue,
                                  calendrier,
                                  notes_complementaires,
                                  maj_termine,
                                  collectivite_id,
                                  restreint)
        values (new.titre,
                new.description,
                new.piliers_eci,
                new.objectifs,
                new.cibles,
                new.ressources,
                new.financements,
                new.budget_previsionnel,
                new.statut,
                new.niveau_priorite,
                new.date_debut,
                new.date_fin_provisoire,
                new.amelioration_continue,
                new.calendrier,
                new.notes_complementaires,
                new.maj_termine,
                new.collectivite_id,
                new.restreint)
        returning id into id_fiche;
        new.id = id_fiche;
    else
        update fiche_action
        set titre                = new.titre,
            description= new.description,
            piliers_eci= new.piliers_eci,
            objectifs= new.objectifs,
            cibles= new.cibles,
            ressources= new.ressources,
            financements= new.financements,
            budget_previsionnel= new.budget_previsionnel,
            statut= new.statut,
            niveau_priorite= new.niveau_priorite,
            date_debut= new.date_debut,
            date_fin_provisoire= new.date_fin_provisoire,
            amelioration_continue= new.amelioration_continue,
            calendrier= new.calendrier,
            notes_complementaires= new.notes_complementaires,
            maj_termine= new.maj_termine,
            collectivite_id      = new.collectivite_id,
            restreint            = new.restreint
        where id = id_fiche;
    end if;

    -- Thématiques
    delete from fiche_action_thematique where fiche_id = id_fiche;
    if new.thematiques is not null then
        foreach thematique in array new.thematiques::thematique[]
            loop
                perform private.ajouter_thematique(id_fiche, thematique.nom);
            end loop;
    end if;
    delete from fiche_action_sous_thematique where fiche_id = id_fiche;
    if new.sous_thematiques is not null then
        foreach sous_thematique in array new.sous_thematiques::sous_thematique[]
            loop
                perform private.ajouter_sous_thematique(id_fiche, sous_thematique.id);
            end loop;
    end if;

    -- Axes
    delete from fiche_action_axe where fiche_id = id_fiche;
    if new.axes is not null then
        foreach axe in array new.axes::axe[]
            loop
                perform ajouter_fiche_action_dans_un_axe(id_fiche, axe.id);
            end loop;
    end if;

    -- Partenaires
    delete from fiche_action_partenaire_tag where fiche_id = id_fiche;
    if new.partenaires is not null then
        foreach partenaire in array new.partenaires::partenaire_tag[]
            loop
                perform private.ajouter_partenaire(id_fiche, partenaire);
            end loop;
    end if;

    -- Structures
    delete from fiche_action_structure_tag where fiche_id = id_fiche;
    if new.structures is not null then
        foreach structure in array new.structures
            loop
                perform private.ajouter_structure(id_fiche, structure);
            end loop;
    end if;

    -- Pilotes
    delete from fiche_action_pilote where fiche_id = id_fiche;
    if new.pilotes is not null then
        foreach pilote in array new.pilotes::personne[]
            loop
                perform private.ajouter_pilote(id_fiche, pilote);
            end loop;
    end if;
    -- Referents
    delete from fiche_action_referent where fiche_id = id_fiche;
    if new.referents is not null then
        foreach referent in array new.referents::personne[]
            loop
                perform private.ajouter_referent(id_fiche, referent);
            end loop;
    end if;

    -- Actions
    delete from fiche_action_action where fiche_id = id_fiche;
    if new.actions is not null then
        foreach action in array new.actions::action_relation[]
            loop
                perform private.ajouter_action(id_fiche, action.id);
            end loop;
    end if;

    -- Indicateurs
    delete from fiche_action_indicateur where fiche_id = id_fiche;
    if new.indicateurs is not null then
        foreach indicateur in array new.indicateurs::indicateur_definition[]
            loop
                perform private.ajouter_indicateur(id_fiche, indicateur);
            end loop;
    end if;

    -- Services
    delete from fiche_action_service_tag where fiche_id = id_fiche;
    if new.services is not null then
        foreach service in array new.services
            loop
                perform private.ajouter_service(id_fiche, service);
            end loop;
    end if;
    -- Financeurs
    delete from fiche_action_financeur_tag where fiche_id = id_fiche;
    if new.financeurs is not null then
        foreach financeur in array new.financeurs::financeur_montant[]
            loop
                perform private.ajouter_financeur(id_fiche, financeur);
            end loop;
    end if;

    -- Fiches liees
    delete from fiche_action_lien where fiche_une = id_fiche or fiche_deux = id_fiche;
    if new.fiches_liees is not null then
        foreach fiche_liee in array new.fiches_liees::private.fiche_resume[]
            loop
                insert into fiche_action_lien (fiche_une, fiche_deux)
                values (id_fiche, fiche_liee.id);
            end loop;
    end if;

    -- Effets attendus (Temporairement, via le nom pour éviter de changer le front)
    delete from fiche_action_effet_attendu where fiche_id= id_fiche;
    if new.resultats_attendus is not null then
        foreach effet_attendu in array new.resultats_attendus::text[]
            loop
                insert into fiche_action_effet_attendu (fiche_id, effet_attendu_id)
                select id_fiche, ea.id
                from effet_attendu ea
                where trim(ea.nom) = trim(effet_attendu)
                on conflict do nothing;
            end loop;
    end if;

    return new;
end;
$$;

create trigger upsert
    instead of insert or update
    on fiches_action
    for each row
execute procedure upsert_fiche_action();

create function plan_action_export(id integer) returns SETOF fiche_action_export
    language sql
BEGIN ATOMIC
WITH RECURSIVE parents AS (
                          SELECT axe.id,
                                 axe.nom,
                                 axe.collectivite_id,
                                 0 AS depth,
                                 ARRAY[]::text[] AS path,
                                 ('0 '::text || axe.nom) AS sort_path
                          FROM axe
                          WHERE ((axe.parent IS NULL) AND (axe.id = plan_action_export.id) AND can_read_acces_restreint(axe.collectivite_id))
                          UNION ALL
                          SELECT a.id,
                                 a.nom,
                                 a.collectivite_id,
                                 (p_1.depth + 1),
                                 (p_1.path || p_1.nom),
                                 ((((p_1.sort_path || ' '::text) || (p_1.depth + 1)) || ' '::text) || a.nom)
                          FROM (parents p_1
                              JOIN axe a ON ((a.parent = p_1.id)))
                          ), fiches AS (
                          SELECT a.id AS axe_id,
                                 f_1.*::fiches_action AS fiche,
                                 f_1.titre
                          FROM ((parents a
                              JOIN fiche_action_axe faa ON ((a.id = faa.axe_id)))
                              JOIN fiches_action f_1 ON (((f_1.collectivite_id = a.collectivite_id) AND (faa.fiche_id = f_1.id))))
                          )
SELECT p.id,
       p.nom,
       p.path,
       to_jsonb(f.*) AS to_jsonb
FROM (parents p
    LEFT JOIN fiches f ON ((p.id = f.axe_id)))
ORDER BY (naturalsort((p.sort_path || (COALESCE(f.titre, ''::character varying))::text)));
END;

COMMIT;

