<script lang="ts">
    /**
     * Note this is a kind of reverse picker as the `fiche action id` is added to the catégorie.
     */

    import CategorieCreation from './_CategorieCreation.svelte'
    import {FicheActionCategorieStorable} from "../../storables/FicheActionCategorieStorable";
    import {onMount} from "svelte";
    import Button from "../../components/shared/Button.svelte";
    import {HybridStore} from "../../api/hybridStore";

    export let ficheActionUid: string
    const defaultCategorie = new FicheActionCategorieStorable({
        uid: '',
        epci_id: '',
        nom: '-',
        parent_uid: '',
        fiche_actions_uids: [ficheActionUid]
    })
    let categories: FicheActionCategorieStorable[] = []
    let selected: FicheActionCategorieStorable
    let categorieStore: HybridStore<FicheActionCategorieStorable>

    /**
     * On user interaction with the select element.
     */
    const onSelect = async (_) => {
        await updateCategories()
    }

    /**
     * Update and save categories that needs to be updated.
     */
    const updateCategories = async () => {
        let changed: FicheActionCategorieStorable[] = []
        // Cleanup
        for (let categorie of categories) {
            // search for categories with this fiche uid excluding selected.
            if (selected && selected.uid === categorie.uid) continue
            if (categorie.fiche_actions_uids.includes(ficheActionUid)) {
                // remove id & add categorie to changed
                categorie.fiche_actions_uids = categorie.fiche_actions_uids.filter((uid) => uid != ficheActionUid)
                changed.push(categorie)
            }
        }

        // Update
        if (selected) {
            // add this fiche uid to selected categorie
            selected.fiche_actions_uids.push(ficheActionUid)
            // add selected to changed
            changed.push(selected)
        }

        // Save all changed
        for (let categorie of changed) {
            if (categorie.uid) await categorieStore.store(categorie)
        }
        refreshSelection()
    }

    let visibleCategorieCreation = false
    const handleNewCategorie = (_) => {
        visibleCategorieCreation = true
    }

    const onCategorieSave = async (_) => {
        visibleCategorieCreation = false
        selected = null
        await updateCategories()
        categories = await categorieStore.retrieveAll()
        refreshSelection()
    }

    const refreshSelection = () => {
        for (let categorie of categories) {
            if (categorie.fiche_actions_uids.includes(ficheActionUid)) {
                selected = categorie
                return;
            }
        }
        selected = null
    }

    onMount(async () => {
        const hybridStores = await import ("../../api/hybridStores");
        categorieStore = hybridStores.ficheActionCategorieStore;
        categories = await categorieStore.retrieveAll()
        categories.push(defaultCategorie)
        refreshSelection()
    })
</script>

<label class="text-xl" for="categorie_picker">Catégorie</label>
<select bind:value={selected}
        class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
        id="categorie_picker"
        on:blur={onSelect}>
    {#each categories as categorie}
        <option value={categorie}>
            {categorie.nom}
        </option>
    {/each}
</select>
<Button classNames="md:w-1/3 self-end"
        full
        label="Nouvelle catégorie"
        on:click={handleNewCategorie}/>

{#if visibleCategorieCreation}
    <CategorieCreation
            ficheActionUid={ficheActionUid}
            on:save={onCategorieSave}/>
{/if}
