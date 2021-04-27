<script lang="ts">
    import {FicheActionStorable} from "../../storables/FicheActionStorable"
    import Button from "../../components/shared/Button/Button.svelte"
    import MultiSelect from './_MultiSelect.svelte'
    import CategoriePicker from './_CategoriePicker.svelte'
    import Status from './_Status.svelte'
    import {requiredValidator} from "../../validation/validators"
    import {createFieldValidator} from "../../validation/validation"
    import {FicheActionInterface} from "../../../generated/models/fiche_action"
    import {onMount} from "svelte"
    import {ActionReferentiel} from "../../../generated/models/action_referentiel"
    import {HybridStore} from "../../api/hybridStore"
    import {testUIVisibility} from "../../api/currentEnvironment";

    export let data: FicheActionInterface

    let ficheActionStore: HybridStore<FicheActionStorable>

    let showLinkActionDialog = false
    let useDialogPicker = false

    // hack fix https://lte.jetbrains.space/p/territoires-en-transitions/issues/302
    let budget: number | string = data.budget

    const handleSave = async () => {
        if (!data.custom_id) return;
        data.budget = Number.parseFloat(budget.toString()) || 0
        const fiche = new FicheActionStorable(data)
        const saved = await ficheActionStore.store(fiche)

        if (saved.uid) window.location.href = `/fiches/?epci_id=${data.epci_id}`
        else window.alert('Une erreur est survenue lors de la sauvegarde de la fiche action.')
    }

    let flatActions: ActionReferentiel[]
    onMount(async () => {
        const hybridStores = await import ("../../api/hybridStores");
        ficheActionStore = hybridStores.ficheActionStore;

        const referentiel = await import("../../../generated/data/actions_referentiels")
        const flattened = [];
        const flatten = (actions: ActionReferentiel[]) => {
            for (let action of actions) {
                flattened.push(action)
                flatten(action.actions)
            }
        }
        flatten(referentiel.actions)
        flatActions = flattened
        useDialogPicker = testUIVisibility()
    });

    const [validity, validate] = createFieldValidator(requiredValidator())
</script>

<svelte:head>
    {#if showLinkActionDialog }
        <style>
            body {
                overflow: hidden;
            }
        </style>
    {/if}
</svelte:head>

<section class="flex flex-col">

    <form class="flex flex-col w-full md:w-3/4 pb-10">

        <label class="text-xl" for="fiche_create_custom_id">Identifiant</label>
        <input bind:value={data.custom_id}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
               id="fiche_create_custom_id"
               maxlength="36"
               use:validate={data.custom_id}>
        {#if $validity.dirty && !$validity.valid}
            <span class="validation-hint">
               {$validity.message}
            </span>
        {/if}
        <div class="p-5"></div>


        <label class="text-xl" for="fiche_create_titre">Titre</label>
        <input bind:value={data.titre}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
               id="fiche_create_titre"
               maxlength="100">
        <div class="p-5"></div>

        <CategoriePicker ficheActionUid={data.uid}/>

        <label class="text-xl" for="fiche_create_description">Description</label>
        <textarea bind:value={data.description}
                  class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                  id="fiche_create_description"></textarea>
        <div class="p-5"></div>


        <div class="p-5"></div>

        <Status bind:avancementKey={data.avancement}
                id="{data.uid}"/>
        <div class="p-5"></div>


        <label class="text-xl" for="fiche_create_porteur">Porteur</label>
        <input bind:value={data.porteur}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
               id="fiche_create_porteur"
               maxlength="100">
        <div class="p-5"></div>

        <label class="text-xl" for="fiche_create_budget">Budget global</label>
        <input bind:value={budget}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
               id="fiche_create_budget"
               type="number">
        <div class="p-5"></div>

        <label class="text-xl" for="fiche_create_commentaire">Commentaire</label>
        <textarea bind:value={data.commentaire}
                  class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                  id="fiche_create_commentaire"></textarea>
        <div class="p-5"></div>

        <span class="text-xl">Calendrier</span>
        <div class="flex">
            <div class="flex-1 flex flex-col pr-1">
                <label for="fiche_create_debut">date de début</label>
                <input bind:value={data.date_debut}
                       class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                       id="fiche_create_debut"
                       type="date">
                <div class="p-5"></div>
            </div>

            <div class="flex-1 flex flex-col pl-1">
                <label for="fiche_create_fin">date de fin</label>
                <input bind:value={data.date_fin}
                       class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
                       id="fiche_create_fin"
                       type="date">
                <div class="p-5"></div>
            </div>
        </div>

        <label class="text-xl" for="fiche_create_commentaire">Actions du référentiel</label>
        {#if flatActions}
            <MultiSelect id='lang' bind:value={data.referentiel_action_ids}>
                {#each flatActions as action}
                    <option value="{action.id}">({action.id_nomenclature}) {action.nom}</option>
                {/each}
            </MultiSelect>
        {/if}

        {#if useDialogPicker}
            <div class="w-full bg-pink-600 my-2 p-2">
                <Button on:click={() => showLinkActionDialog = true }
                        size="small">
                    + Lier une action
                </Button>
            </div>
        {/if}
        <div class="p-10"></div>
        <Button classNames="md:w-1/3 self-end"
                full
                on:click={handleSave}>
            Valider
        </Button>
    </form>

    {#if showLinkActionDialog}
        {#await import('./_LinkActionDialog.svelte') then c}
            <svelte:component this={c.default} on:LinkActionDialogClose={() => showLinkActionDialog = false }/>
        {/await}
    {/if}
</section>