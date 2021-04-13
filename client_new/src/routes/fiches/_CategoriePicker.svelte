<script lang="ts">
    // Note this is a kind of reverse picker as the `fiche action id` is added to the catégorie.

    import {FicheActionCategorieStorable} from "../../storables/FicheActionCategorieStorable";

    export let ficheActionUid: string
    let categories: FicheActionCategorieStorable[] = []
    let selected: FicheActionCategorieStorable

    const onSelect = (_) => {
        let changed: FicheActionCategorieStorable[] = []
        // todo
        // cleanup
        // - search for categories with this fiche uid
        //   - remove id & add cat to changed
        // add this fiche uid to selected categorie
        //  - add selected to changed
        // save all changed
    }
</script>

<select bind:value={selected}
        class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
        id="mesure_create_climat_pratic"

        on:blur={onSelect}>
    {#each categories as categorie}
        <option value={categorie}>
            {categorie.nom}
        </option>
    {/each}
</select>