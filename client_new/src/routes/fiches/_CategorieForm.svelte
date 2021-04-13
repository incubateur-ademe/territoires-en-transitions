<script lang="ts">
    import {FicheActionCategorieInterface} from "../../../generated/models/fiche_action_categorie";
    import {ficheActionCategorieStore, LocalStore} from "../../api/localStore";
    import {FicheActionCategorieStorable} from "../../storables/FicheActionCategorieStorable";
    import {onMount} from "svelte";
    import Button from "../../components/shared/Button.svelte";

    export let data: FicheActionCategorieInterface
    let categorieStore: LocalStore<FicheActionCategorieStorable>

    onMount(async () => {
        // todo replace with hybrid store
        categorieStore = ficheActionCategorieStore
    })

    const handleSave = async () => {
        const categorie = new FicheActionCategorieStorable(data)
        await categorieStore.store(categorie)
    }
</script>

<label for="fiche_create_titre" class="text-xl">Titre</label>
<input id="fiche_create_titre"
       bind:value={data.titre}
       class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
<div class="p-10"></div>
<Button full
        label="Valider"
        on:click={handleSave}
        classNames="md:w-1/3 self-end"/>