<script lang="ts">
    import {FicheActionCategorieInterface} from "../../../generated/models/fiche_action_categorie";
    import {FicheActionCategorieStorable} from "../../storables/FicheActionCategorieStorable";
    import {createEventDispatcher, onMount} from "svelte";
    import Button from "../../components/shared/Button/Button.svelte";
    import {HybridStore} from "../../api/hybridStore";

    export let data: FicheActionCategorieInterface
    let categorieStore: HybridStore<FicheActionCategorieStorable>
    const dispatch = createEventDispatcher()

    onMount(async () => {
        const hybridStores = await import ("../../api/hybridStores");
        categorieStore = hybridStores.ficheActionCategorieStore;
    })

    const handleSave = async () => {
        if (!data.nom) return;
        const categorie = new FicheActionCategorieStorable(data)
        const saved = await categorieStore.store(categorie)
        console.log('saved', saved)
        dispatch('save', {'categorie': saved})
    }
</script>

<section class="flex flex-col">
    <label class="text-sm" for="fiche_create_nom">Nom</label>
    <input bind:value={data.nom}
           class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
           id="fiche_create_nom"
           maxlength="100">
    <div class="p-2"></div>
    <Button classNames="md:w-1/3 self-end bg-white"
            full
            label="Valider"
            on:click={handleSave}/>
</section>