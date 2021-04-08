<script lang="ts">
    import {FicheActionStorable} from "../../storables/FicheActionStorable";
    import {ficheActionStore} from "../../api/localStore";
    import Button from "../../components/shared/Button.svelte";
    import {requiredValidator} from "../../validation/validators"
    import {createFieldValidator} from "../../validation/validation"
    import {FicheActionInterface} from "../../../generated/models/fiche_action";


    export let data: FicheActionInterface


    const handleSave = async () => {
        const fiche = new FicheActionStorable(data)
        await ficheActionStore.store(fiche)
        window.location.href = `/fiches/?epci_id=${data.epci_id}`
    }

    const [validity, validate] = createFieldValidator(requiredValidator())

</script>


<section class="flex flex-col">

    <div class="flex flex-col w-full md:w-3/4 pb-10">

        <label for="fiche_create_custom_id">Identifiant, selon ma nomenclature.</label>
        <input id="fiche_create_custom_id"
               bind:value={data.custom_id}
               use:validate={data.custom_id}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        {#if $validity.dirty && !$validity.valid}
            <span class="validation-hint">
               {$validity.message} {$validity.dirty}
            </span>
        {/if}
        <div class="p-5"></div>


        <label for="fiche_create_titre">Titre</label>
        <input id="fiche_create_titre"
               bind:value={data.titre}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        <div class="p-5"></div>

        <label for="fiche_create_description">Description</label>
        <textarea id="fiche_create_description"
                  bind:value={data.description}
                  class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"></textarea>
        <div class="p-5"></div>

        <label for="fiche_create_budget">Budget global</label>
        <input id="fiche_create_budget"
               bind:value={data.budget}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        <div class="p-5"></div>


        <label for="fiche_create_porteur">Porteur</label>
        <input id="fiche_create_porteur"
               bind:value={data.porteur}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        <div class="p-5"></div>


        <label for="fiche_create_commentaire">Commentaire</label>
        <textarea id="fiche_create_commentaire"
                  bind:value={data.commentaire}
                  class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"></textarea>
    </div>

    <Button full
            label="Valider"
            on:click={handleSave}
            classNames="md:w-1/3 self-end"/>
</section>