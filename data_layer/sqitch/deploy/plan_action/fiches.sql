-- Deploy tet:plan_action/fiches to pg

BEGIN;

create or replace function upsert_fiche_action()
    returns trigger as
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
    indicateur      indicateur_generique;
    service         service_tag;
    financeur       financeur_montant;
    fiche_liee      fiche_resume;
begin
    id_fiche = new.id;
    -- Fiche action
    if id_fiche is null then
        insert into fiche_action (titre,
                                  description,
                                  piliers_eci,
                                  objectifs,
                                  resultats_attendus,
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
                                  collectivite_id)
        values (new.titre,
                new.description,
                new.piliers_eci,
                new.objectifs,
                new.resultats_attendus,
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
                new.collectivite_id)
        returning id into id_fiche;
        new.id = id_fiche;
    else
        update fiche_action
        set titre                = new.titre,
            description= new.description,
            piliers_eci= new.piliers_eci,
            objectifs= new.objectifs,
            resultats_attendus= new.resultats_attendus,
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
            collectivite_id      = new.collectivite_id
        where id = id_fiche;
    end if;

    -- Thématiques
    delete from fiche_action_thematique where fiche_id = id_fiche;
    if new.thematiques is not null then
        foreach thematique in array new.thematiques::thematique[]
            loop
                perform ajouter_thematique(id_fiche, thematique.thematique);
            end loop;
    end if;
    delete from fiche_action_sous_thematique where fiche_id = id_fiche;
    if new.sous_thematiques is not null then
        foreach sous_thematique in array new.sous_thematiques::sous_thematique[]
            loop
                perform ajouter_sous_thematique(id_fiche, sous_thematique.id);
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
                perform ajouter_partenaire(id_fiche, partenaire);
            end loop;
    end if;

    -- Structures
    delete from fiche_action_structure_tag where fiche_id = id_fiche;
    if new.structures is not null then
        foreach structure in array new.structures
            loop
                perform ajouter_structure(id_fiche, structure);
            end loop;
    end if;

    -- Pilotes
    delete from fiche_action_pilote where fiche_id = id_fiche;
    if new.pilotes is not null then
        foreach pilote in array new.pilotes::personne[]
            loop
                perform ajouter_pilote(id_fiche, pilote);
            end loop;
    end if;

    -- Referents
    delete from fiche_action_referent where fiche_id = id_fiche;
    if new.referents is not null then
        foreach referent in array new.referents::personne[]
            loop
                perform ajouter_referent(id_fiche, referent);
            end loop;
    end if;

    -- Actions
    delete from fiche_action_action where fiche_id = id_fiche;
    if new.actions is not null then
        foreach action in array new.actions::action_relation[]
            loop
                perform ajouter_action(id_fiche, action.id);
            end loop;
    end if;

    -- Indicateurs
    delete from fiche_action_indicateur where fiche_id = id_fiche;
    if new.indicateurs is not null then
        foreach indicateur in array new.indicateurs::indicateur_generique[]
            loop
                perform ajouter_indicateur(id_fiche, indicateur);
            end loop;
    end if;

    -- Services
    delete from fiche_action_service_tag where fiche_id = id_fiche;
    if new.services is not null then
        foreach service in array new.services
            loop
                perform ajouter_service(id_fiche, service);
            end loop;
    end if;

    -- Financeurs
    delete from fiche_action_financeur_tag where fiche_id = id_fiche;
    if new.financeurs is not null then
        foreach financeur in array new.financeurs::financeur_montant[]
            loop
                perform ajouter_financeur(id_fiche, financeur);
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

    return new;
end;
$$ language plpgsql;

COMMIT;
