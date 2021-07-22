<script lang="ts">
    import CategorieInlineEdition from './_CategorieInlineEdition.svelte'
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import type {FicheActionStorable} from "../../storables/FicheActionStorable";
    import type {HybridStore} from "../../api/hybridStore";
    import {FicheActionCategorieStorable} from "../../storables/FicheActionCategorieStorable";
    import SelectInput from "../../components/shared/Forms/SelectInput.svelte";
    import {fiche_action_avancement_noms} from "$generated/models/fiche_action_avancement_noms";
    import FicheActionCard from "../../components/shared/FicheAction/FicheActionCard.svelte";
    import { categorizeAndSortFiches } from './utils';
    import type { CategorizedFiche } from './utils';

    const defaultCategorie = new FicheActionCategorieStorable({
        uid: '',
        epci_id: '',
        nom: 'sans categorie',
        parent_uid: '',
        fiche_actions_uids: []
    })
    let epciId = ''
    let fiches: Array<FicheActionStorable> = []
    let ficheActionStore: HybridStore<FicheActionStorable>
    let categories: FicheActionCategorieStorable[] = []
    let categorieStore: HybridStore<FicheActionCategorieStorable>
    let categorizedFiches:  CategorizedFiche[] = [] 
    let filteredCategorizedFiches:  CategorizedFiche[] = []
    // Les avancements pour filtrer les fiches.
    const avancementsChoices = fiche_action_avancement_noms
    // l'avancement selectionné
    let selectedAvancementKey = ''
    // Les personnes référents issues des fiches pour les filtres.
    let personnesReferentesChoices: Set<string> = new Set<string>()
    // La personne référente selectionnée
    let selectedPersonneReferente = ''
    // Les structures pilote issues des fiches pour les filtres.
    let structuresPiloteChoices: Set<string> = new Set<string>()
    // La structure pilote selectionnée
    let selectedStructuresPilote = ''
    /**
     * Populate filter values from fiches.
     */
    const populateFilters = () => {
        personnesReferentesChoices = new Set(fiches.map((fiche) => fiche.personne_referente))
        structuresPiloteChoices = new Set(fiches.map((fiche) => fiche.structure_pilote))
    }
    /**
     * The main filter function
     */
    const filterPredicate = (fiche: FicheActionStorable): boolean => {
        return (!selectedPersonneReferente || fiche.personne_referente === selectedPersonneReferente)
            && (!selectedAvancementKey || fiche.avancement === selectedAvancementKey)
            && (!selectedStructuresPilote || fiche.structure_pilote === selectedStructuresPilote)
    }
    /**
     * Filter fiches.
     */
     const filterFiches = async () => {
        populateFilters()
        filteredCategorizedFiches = categorizedFiches.map((categorizedFiche) => ({...categorizedFiche, fiches: categorizedFiche.fiches.filter(filterPredicate)})) 
    }
    /**
     * Categorize fiches
     */
     const categorizeFiches = async () => {
        categorizedFiches = categorizeAndSortFiches(fiches, categories, defaultCategorie)
    }
    /**
     * Get fiches from store.
     */
    const getFiches = async () => {
        let fiches = await ficheActionStore.retrieveAll()
        categorizedFiches = categorizeAndSortFiches(fiches, categories, defaultCategorie)
    }
    /**
     * Get categories from store.
     */
    const getCategories = async () => {
        let retrieved = await categorieStore.retrieveAll()
        categories = retrieved.sort((a, b) => a.nom.localeCompare(b.nom))
    }
    onMount(async () => {
        epciId = getCurrentEpciId()
        const hybridStores = await import ("$api/hybridStores");
        categorieStore = hybridStores.ficheActionCategorieStore;
        ficheActionStore = hybridStores.ficheActionStore
        await getCategories()
        await getFiches()
        await filterFiches()
        await categorizeFiches()
    });
</script>

<style>
    .page-intro {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .page-intro h1 {
        max-width: 80%;
    }
    .select-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 2.875rem;
        max-width: 75%;
        margin-top: 3.25rem;
    }
    li + li {
        margin-top: 1rem;
    }
    .categorie {
        padding-top: 4rem;
    }
</style>
<svelte:head>
    <title>Plan d'actions</title>
</svelte:head>

<header>
    <div class="page-intro">
        <h1>Plan d'actions de ma collectivité</h1>

        <a class="fr-btn"
           href="fiches/creation/?epci_id={epciId}">
            Ajouter une fiche action
        </a>
    </div>

    <div class="select-list">
        <!-- statut -->
        <SelectInput bind:value={selectedAvancementKey}
                     label="Statut d'avancement"
                     onChange={filterFiches}>
            <option value=''>
                Toutes
            </option>
            {#each Object.entries(avancementsChoices) as [key, nom]}
                <option value={key}>
                    {nom}
                </option>
            {/each}
        </SelectInput>

        <!-- personne -->
        <SelectInput bind:value={selectedPersonneReferente}
                     label="Personne référente"
                     onChange={filterFiches}>
            <option value=''>
                Toutes
            </option>
            {#each [...personnesReferentesChoices] as personne}
                <option value={personne}>
                    {personne}
                </option>
            {/each}
        </SelectInput>

        <!-- structure -->
        <SelectInput bind:value={selectedStructuresPilote}
                     label="Structure pilote"
                     onChange={filterFiches}>
            <option value=''>
                Toutes
            </option>
            {#each [...structuresPiloteChoices] as structure}
                <option value={structure}>
                    {structure}
                </option>
            {/each}
        </SelectInput>
    </div>
</header>

<section>
    {#each [...filteredCategorizedFiches] as categorizedFiche}
        <div class="categorie">
            {#if categorizedFiche.categorie.uid === defaultCategorie.uid}
                <h3 class="text-2xl">{categorizedFiche.categorie.nom}</h3>
            {:else}
                <CategorieInlineEdition categorie={categorizedFiche.categorie}/>
            {/if}
            <ul>
                {#each categorizedFiche.fiches as fiche}
                    <li>
                        <FicheActionCard fiche={fiche}/>
                    </li>
                {/each}
            </ul>
        </div>
    {/each}
</section>
