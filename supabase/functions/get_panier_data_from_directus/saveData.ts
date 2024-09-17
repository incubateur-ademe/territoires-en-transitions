import {ActionImpact, Datas} from "./types.ts";
import {TSupabaseClient} from '../_shared/getSupabaseClient.ts';
import {
    getActionsImpactFromDirectus,
    getIndicateurPredefiniFromBD,
    getPartenairesFromDirectus,
    getSousThematiquesFromBD,
    getSousThematiquesFromDirectus
} from "./fetchData.ts";

/**
 * Upsert les partenaires en BDD
 * @param supabaseClient
 */
export const savePartenaires = async (supabaseClient: TSupabaseClient) : Promise<void> => {
    const partenaires = await getPartenairesFromDirectus();
    const {error} = await supabaseClient.from("panier_partenaire").upsert(partenaires);
    if (error) {
        throw new Error(error.message);
    }
    console.log('Sauvegarde des partenaires réussi');
}

/**
 * Upsert les actions à impact en BDD ainsi que les tables associées
 * @param supabaseClient
 */
export const saveActionsImpact = async (supabaseClient: TSupabaseClient): Promise<void> => {
    // Récupère les données BDD utile à la mise à jour
    const datas : Datas = {
        sousThematiques: await getSousThematiquesFromBD(supabaseClient),
        indicateurs: await getIndicateurPredefiniFromBD(supabaseClient),
        sousThematiquesDirectus : await getSousThematiquesFromDirectus()
    }

    // MàJ des actions à impact
    // Récupère les données de directus
    const actions = await getActionsImpactFromDirectus();
    // Pour chaque action à impact
    for(let action of actions){
        // Sauvegarde l'action et ses champs associés dans la BDD
        await saveActionImpact(supabaseClient, action, datas);
    }
}

/**
 * Upsert une action à impact en BDD ainsi que les tables associées
 * @param supabaseClient
 * @param action
 * @param datas données provenant de directus et de la BDD utiles à la sauvegarde
 */
export const saveActionImpact = async (
    supabaseClient: TSupabaseClient,
    action : ActionImpact,
    datas : Datas
) : Promise<void> => {
    // Upsert action_impact
    const actionToSave = {
        id: action.id,
        titre: action.titre,
        description: action.description_courte,
        fourchette_budgetaire: action.fourchette_budgetaire?.niveau,
        description_complementaire: action.description_longue || '',
        temps_de_mise_en_oeuvre: action.temps_de_mise_en_oeuvre?.niveau,
        ressources_externes: action.ressources_externes,
        rex: action.rex,
        subventions_mobilisables: action.subventions_mobilisables,
    }
    const {error} = await supabaseClient.from("action_impact").upsert(actionToSave);
    if (error) {
        throw new Error(error.message);
    }
    console.log(`Action ${action.id} - Sauvegarde de l''action à impact : réussi`);

    // Upsert action_impact_thematique
    await supabaseClient.from("action_impact_thematique").delete().eq('action_impact_id', action.id);
    for (let thematique of action.thematiques){
        const query = await supabaseClient.from("action_impact_thematique").insert({
            'action_impact_id' : action.id,
            'thematique_id' : thematique.thematique_id
        });

        if(query?.error){
            console.log(`Action ${action.id} - Sauvegarde de la thématique ${thematique.thematique_id} : échec`);
            console.log(query.error.message);
        }else{
            console.log(`Action ${action.id} - Sauvegarde de la thématique ${thematique.thematique_id} : réussi`);
        }
    }

    // Upsert action_impact_sous-thématique
    // /!\ sous_thematiques.sous_thematique_id ne match pas les id en BDD, il faut faire le lien via le nom
    await supabaseClient.from("action_impact_sous_thematique").delete().eq('action_impact_id', action.id);
    for (let thematique of action.sous_thematiques){
        // Récupère le nom de la sous thématique dans directus
        const thematiqueDirectus = datas.sousThematiquesDirectus.find(t => t.id === thematique.sous_thematique_id);
        if(thematiqueDirectus){
            // Fait le lien avec la sous thématique en BDD via le nom
            const thematiqueBDD = datas.sousThematiques.get(thematiqueDirectus.nom);
            if(thematiqueBDD){
                const query = await supabaseClient.from("action_impact_sous_thematique").insert({
                    'action_impact_id' : action.id,
                    'sous_thematique_id' : thematiqueBDD.id
                });
                if(query?.error){
                    console.log(`Action ${action.id} - Sauvegarde de la sous thématique ${thematiqueBDD.id} : échec`);
                    console.log(query.error.message);
                }else{
                    console.log(`Action ${action.id} - Sauvegarde de la sous thématique ${thematiqueBDD.id} : réussi`);
                }
            }
        }
    }

    // Upsert action_impact_indicateur
    // /!\ Directus fait le lien vers les identifiants référentiels des indicateurs et non les ids BDD
    await supabaseClient.from("action_impact_indicateur").delete().eq('action_impact_id', action.id);
    for(let indicateur of action.indicateurs){
        // Récupère l'indentifiant BDD de l'indicateur à partir de son identifiant référentiel
        const indicateurId = datas.indicateurs.get(indicateur.indicateur_predefini_id)?.id;
        if(indicateurId){
            const query = await supabaseClient.from("action_impact_indicateur").insert({
                'action_impact_id' : action.id,
                'indicateur_id' :indicateurId
            });
            if(query?.error){
                console.log(`Action ${action.id} - Sauvegarde de l'indicateur ${indicateur.indicateur_predefini_id} : échec`);
                console.log(query.error.message);
            }else{
                console.log(`Action ${action.id} - Sauvegarde de l'indicateur ${indicateur.indicateur_predefini_id} : réussi`);
            }
        }
    }

    // Upsert action_impact_effet_attendu
    await supabaseClient.from("action_impact_effet_attendu").delete().eq('action_impact_id', action.id);
    for (let effet of action.effets_attendus){
        const query = await supabaseClient.from("action_impact_effet_attendu").insert({
            'action_impact_id' : action.id,
            'effet_attendu_id' : effet.action_impact_effet_attendu_id
        });
        if(query?.error){
            throw new Error(query.error.message);
        }
        console.log(`Action ${action.id} - Sauvegarde de l'effet attendu ${effet.action_impact_effet_attendu_id} réussi`);
    }

    // Upsert action_impact_partenaire
    await supabaseClient.from("action_impact_partenaire").delete().eq('action_impact_id', action.id);
    for(let partenaire of action.partenaires){
        const query = await supabaseClient.from("action_impact_partenaire").insert({
                'action_impact_id' : action.id,
                'partenaire_id' : partenaire.action_impact_partenaire_id
        });
        if(query?.error){
            console.log(`Action ${action.id} - Sauvegarde du partenaire ${partenaire.action_impact_partenaire_id} : échec`);
            console.log(query.error.message);
        }else{
            console.log(`Action ${action.id} - Sauvegarde du partenaire ${partenaire.action_impact_partenaire_id} : réussi`);
        }
    }

    // Upsert action_impact_action
    await supabaseClient.from("action_impact_action").delete().eq('action_impact_id', action.id);
    for(let actionRef of action.actions_referentiel){
        const query = await supabaseClient.from("action_impact_action").insert({
            'action_impact_id' : action.id,
            'action_id' : actionRef.action_referentiel_id
        });
        if(query?.error){
            console.log(`Action ${action.id} - Sauvegarde de l'action référentiel ${actionRef.action_referentiel_id} : échec`);
            console.log(query.error.message);
        }else{
            console.log(`Action ${action.id} - Sauvegarde de l'action référentiel ${actionRef.action_referentiel_id} : réussi`);
        }

    }

    // Upsert banatic_competences
    await supabaseClient.from("action_impact_banatic_competence").delete().eq('action_impact_id', action.id);
    for(let competence of action.banatic_competences){
        const query = await supabaseClient.from("action_impact_banatic_competence").insert({
            'action_impact_id' : action.id,
            'competence_code' : competence.banatic_competence_code
        });
        if(query?.error){
            console.log(`Action ${action.id} - Sauvegarde de la compétence ${competence.banatic_competence_code} : échec`);
            console.log(query.error.message);
        }else{
            console.log(`Action ${action.id} - Sauvegarde de la compétence ${competence.banatic_competence_code} : réussi`);
        }

    }

    // typologie pas importé
    // notes_travail pas importé
    // statut pas importé
    // elements_budgetaires pas importé
    // indicateur_impact_carbone pas importé
    // competences_communales pas importé
    // independamment_competences pas importé
    // banatic_competences_parents pas importé
    // indicateur_suivi pas importé

}