<script lang="ts">
    import Button from "../../components/shared/Button/Button.svelte";
    import CategorieInlineEdition from './_CategorieInlineEdition.svelte'
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {FicheActionStorable} from "../../storables/FicheActionStorable";
    import {HybridStore} from "../../api/hybridStore";
    import {FicheActionCategorieStorable} from "../../storables/FicheActionCategorieStorable";
    import SelectInput from "../../components/shared/Forms/SelectInput.svelte";
    import {fiche_action_avancement_noms} from "../../../../generated/models/fiche_action_avancement_noms";
    import RowCard from "../../components/shared/RowCard.svelte";
    import FicheActionCard from "../../components/shared/FicheAction/FicheActionCard.svelte";

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

    let fichesByCategorie = new Map<FicheActionCategorieStorable, FicheActionStorable[]>()
    let filteredFichesByCategorie = new Map<FicheActionCategorieStorable, FicheActionStorable[]>()


    /**
     * Updates fichesByName by sorting all fiches by category name.
     */
    const categorizeAll = () => {
        let byCategorie = new Map<FicheActionCategorieStorable, FicheActionStorable[]>()
        const addAt = (fiche: FicheActionStorable, categorie: FicheActionCategorieStorable) => {
            if (!byCategorie.has(categorie)) byCategorie.set(categorie, [])
            byCategorie.get(categorie).push(fiche)
        }

        let uncategorized = [...fiches]

        for (let categorie of categories) {
            for (let fiche of fiches) {
                if (categorie.fiche_actions_uids.includes(fiche.uid)) {
                    addAt(fiche, categorie)
                    uncategorized = uncategorized.filter((f) => f.uid != fiche.uid)
                }
            }
        }

        for (let fiche of uncategorized) {
            addAt(fiche, defaultCategorie)

        }

        filteredFichesByCategorie = fichesByCategorie = byCategorie
    }

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
        personnesReferentesChoices.clear()
        structuresPiloteChoices.clear()

        for (let fiche of fiches) {
            if (fiche.personne_referente)
                personnesReferentesChoices.add(fiche.personne_referente)
            if (fiche.structure_pilote)
                structuresPiloteChoices.add(fiche.structure_pilote)
        }

        personnesReferentesChoices = personnesReferentesChoices
        structuresPiloteChoices = structuresPiloteChoices
    }

    /**
     * Apply filters
     */
    const applyFilters = () => {
        let filtered = new Map<FicheActionCategorieStorable, FicheActionStorable[]>()
        fichesByCategorie.forEach(
            (fiches: FicheActionStorable[], category: FicheActionCategorieStorable, _) => {
                let matches = []
                for (let fiche of fiches) {
                    if (filterPredicate(fiche)) matches.push(fiche)
                }
                filtered.set(category, matches)
            });

        filteredFichesByCategorie = filtered
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
     * Update fiches using store.
     */
    const updateFiches = async () => {
        let retrieved = await ficheActionStore.retrieveAll()
        fiches = retrieved.sort((a, b) => a.custom_id.localeCompare(b.custom_id))
        populateFilters()
        categorizeAll()
    }

    /**
     * Update categories using store.
     */
    const updateCategories = async () => {
        let retrieved = await categorieStore.retrieveAll()
        categories = retrieved.sort((a, b) => a.nom.localeCompare(b.nom))
        categorizeAll()
    }


    onMount(async () => {
        epciId = getCurrentEpciId()
        const hybridStores = await import ("../../api/hybridStores");
        categorieStore = hybridStores.ficheActionCategorieStore;
        ficheActionStore = hybridStores.ficheActionStore

        await updateCategories()
        await updateFiches()
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

    .enRetard {

    }
</style>
<svelte:head>
    <title>Plan d'actions</title>
</svelte:head>

<header>
    <div class="page-intro">
        <h1>Plan d'actions de ma collectivité</h1>

        <a href="fiches/creation/?epci_id={epciId}"
           class="fr-btn">
            Ajouter à mes actions
        </a>
    </div>

    <div class="select-list">
        <!-- status -->
        <SelectInput bind:value={selectedAvancementKey}
                     class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                     id="categorie_picker"
                     label="Status d'avancement"
                     onChange={applyFilters}>
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
                     class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                     id="categorie_picker"
                     label="Personne référente"
                     onChange={applyFilters}>
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
                     class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                     id="categorie_picker"
                     label="Structure pilote"
                     onChange={applyFilters}>
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

{#each [...filteredFichesByCategorie] as [categorie, fiches]}
    {#if categorie.uid === defaultCategorie.uid}
        <h3 class="text-2xl">{categorie.nom}</h3>
    {:else}
        <CategorieInlineEdition categorie={categorie}/>
    {/if}
    <ul>
        {#each fiches as fiche}
            <li>
                <FicheActionCard fiche={fiche}/>
            </li>
        {/each}
    </ul>
{/each}

