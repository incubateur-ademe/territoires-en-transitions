<script lang="ts">
    import Button from "../../components/shared/Button.svelte";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {FicheActionStorable} from "../../storables/FicheActionStorable";
    import {HybridStore} from "../../api/hybridStore";
    import {FicheActionCategorieStorable} from "../../storables/FicheActionCategorieStorable";
    import {ficheActionCategorieStore, LocalStore} from "../../api/localStore";

    const defaultCategorieNom = 'Sans catégorie'
    let epciId = ''
    let fiches: Array<FicheActionStorable> = []
    let ficheActionStore: HybridStore<FicheActionStorable>

    let categories: FicheActionCategorieStorable[] = []
    let categorieStore: LocalStore<FicheActionCategorieStorable>

    let categorized = new Map<string, FicheActionStorable[]>()


    const categorize = (fiche: FicheActionStorable) => {
        const addAt = (nom) => {
            if (!categorized.has(nom)) categorized.set(nom, [])
            categorized.get(nom).push(fiche)
        }

        for (let categorie of categories) {
            if (categorie.fiche_actions_uids.includes(fiche.uid)) {
                addAt(categorie.nom)
                return
            }
        }
        addAt(defaultCategorieNom)
    }

    const categorizeAll = () => {
        categorized = new Map<string, FicheActionStorable[]>()
        for (let fiche of fiches) {
            categorize(fiche)
        }
        console.log(categorized)
    }

    const updateActions = async () => {
        let retrieved = await ficheActionStore.retrieveAll()
        fiches = retrieved.sort((a, b) => a.custom_id.localeCompare(b.custom_id))
        categorizeAll()
    }

    const updateCategories = async () => {
        let retrieved = await categorieStore.retrieveAll()
        categories = retrieved.sort((a, b) => a.nom.localeCompare(b.nom))
        categorizeAll()
    }

    onMount(async () => {
        epciId = getCurrentEpciId()
        const hybridStores = await import ("../../api/hybridStores");
        ficheActionStore = hybridStores.ficheActionStore
        await updateActions()

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

{#each [...categorized] as [nom, fiches]}
    <h3>{nom}</h3>
    <ul>
        {#each fiches as fiche}
            <li>
                <a class="bg-white p-4 rounded my-4 grid grid-cols-1 lg:grid-cols-12 lg:gap-1"
                   href="fiches/edition/?epci_id={epciId}&uid={fiche.uid}">
                    <h3 class="lg:col-span-8 text-xl font-semibold mb-6 pr-28">
                        ({fiche.custom_id}) {fiche.titre}
                    </h3>
                </a>
            </li>
        {/each}
    </ul>
    <div class="p-5"></div>
{/each}

<div class="p-5"></div>

