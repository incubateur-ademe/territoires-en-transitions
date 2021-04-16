<script lang="ts">
    import Button from "../../components/shared/Button.svelte";
    import CategorieInlineEdition from './_CategorieInlineEdition.svelte'
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {FicheActionStorable} from "../../storables/FicheActionStorable";
    import {HybridStore} from "../../api/hybridStore";
    import {FicheActionCategorieStorable} from "../../storables/FicheActionCategorieStorable";
    import {ficheActionCategorieStore, LocalStore} from "../../api/localStore";

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
    let categorieStore: LocalStore<FicheActionCategorieStorable>

    let fichesByCategorie = new Map<FicheActionCategorieStorable, FicheActionStorable[]>()


    /**
     * Adds a fiche under its category name.
     */
    const categorize = (fiche: FicheActionStorable, fichesByName: Map<FicheActionCategorieStorable, FicheActionStorable[]>) => {
        const addAt = (categorie: FicheActionCategorieStorable) => {
            if (!fichesByName.has(categorie)) fichesByName.set(categorie, [])
            fichesByName.get(categorie).push(fiche)
        }

        for (let categorie of categories) {
            if (categorie.fiche_actions_uids.includes(fiche.uid)) {
                addAt(categorie)
                return
            }
        }
        addAt(defaultCategorie)
    }

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

        fichesByCategorie = byCategorie
    }

    /**
     * Update fiches using store.
     */
    const updateFiches = async () => {
        let retrieved = await ficheActionStore.retrieveAll()
        fiches = retrieved.sort((a, b) => a.custom_id.localeCompare(b.custom_id))
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

    /**
     * Handle categorie edition
     */
    const onCategorieSave = updateCategories

    onMount(async () => {
        epciId = getCurrentEpciId()
        const hybridStores = await import ("../../api/hybridStores");
        ficheActionStore = hybridStores.ficheActionStore
        await updateFiches()

        // todo replace with hybrid store
        // after fiches to check asynchronicity
        categorieStore = ficheActionCategorieStore
        await updateCategories()
    });
</script>
<svelte:head>
    <title>Plan d'actions</title>
</svelte:head>

<header class="flex my-10">
    <h1 class="text-3xl font-semibold  flex-grow">Plan d'actions de ma collectivité</h1>
    <Button asLink
            href="fiches/creation/?epci_id={epciId}"
            label="Créer une fiche action"/>
</header>
<div class="p-5"></div>

{#each [...fichesByCategorie] as [categorie, fiches]}
    {#if categorie.uid === defaultCategorie.uid}
        <h3 class="text-2xl">{categorie.nom}</h3>
    {:else}
        <CategorieInlineEdition categorie={categorie}/>
    {/if}
    <ul>
        {#each fiches as fiche}
            <li>
                <a class="bg-white rounded my-4 grid grid-cols-1 lg:grid-cols-12 lg:gap-1"
                   href="fiches/edition/?epci_id={epciId}&uid={fiche.uid}">
                    <h3 class="lg:col-span-8 text-lg mb-6 pr-28">
                        ({fiche.custom_id}) {fiche.titre}
                    </h3>
                </a>
            </li>
        {/each}
    </ul>
    <div class="p-5"></div>
{/each}

<div class="p-5"></div>

