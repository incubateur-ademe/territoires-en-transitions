<script lang="ts">
    import {FicheActionStorable} from "../../storables/FicheActionStorable"
    import Button from "../../components/shared/Button/Button.svelte"
    import MultiSelect from './_MultiSelect.svelte'
    import Status from './_Status.svelte'
    import LinkActionDialog from './_LinkActionDialog.svelte'
    import {requiredValidator} from "../../validation/validators"
    import {createFieldValidator} from "../../validation/validation"
    import {FicheActionInterface} from "../../../generated/models/fiche_action"
    import {onMount} from "svelte"
    import {ActionReferentiel} from "../../../generated/models/action_referentiel"
    import {HybridStore} from "../../api/hybridStore"

    export let data: FicheActionInterface

    let ficheActionStore: HybridStore<FicheActionStorable>
    let referentiels
    let thematiques

    $: showLinkActionDialog = false
    $: dialogContentLoaded = referentiels && thematiques

    const handleSave = async () => {
        if (!data.custom_id) return;
        const fiche = new FicheActionStorable(data)
        await ficheActionStore.store(fiche)
        window.location.href = `/fiches/?epci_id=${data.epci_id}`
    }

    // let flatActions: ActionReferentiel[]
    onMount(async () => {
    //     const hybridStores = await import ("../../api/hybridStores");
    //     ficheActionStore = hybridStores.ficheActionStore;

        referentiels = await import("../../../generated/data/actions_referentiels")
        thematiques = await import("../../../generated/data/thematiques")
    //     const flattened = [];
    //     const flatten = (actions: ActionReferentiel[]) => {
    //         for (let action of actions) {
    //             flattened.push(action)
    //             flatten(action.actions)
    //         }
    //     }
    //     flatten(referentiel.actions)
    //     flatActions = flattened
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

        <label for="fiche_create_custom_id" class="text-xl">Identifiant de l'action</label>
        <input id="fiche_create_custom_id"
               bind:value={data.custom_id}
               use:validate={data.custom_id}
               maxlength="36"
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        {#if $validity.dirty && !$validity.valid}
            <span class="validation-hint">
               {$validity.message}
            </span>
        {/if}
        <div class="p-5"></div>


        <label for="fiche_create_titre" class="text-xl">Titre</label>
        <input id="fiche_create_titre"
               bind:value={data.titre}
               maxlength="100"
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        <div class="p-5"></div>

        <Status bind:avancementKey={data.avancement}
                id="{data.uid}"/>
        <div class="p-5"></div>

        <label for="fiche_create_description" class="text-xl">Description</label>
        <textarea id="fiche_create_description"
                  bind:value={data.description}
                  class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"></textarea>
        <div class="p-5"></div>

        <label for="fiche_create_budget" class="text-xl">Budget global</label>
        <input id="fiche_create_budget"
               type="number"
               bind:value={data.budget}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        <div class="p-5"></div>

        <span class="text-xl">Calendrier</span>

        <div class="flex">
            <div class="flex-1 flex flex-col pr-1">
                <label for="fiche_create_debut">date de début</label>
                <input id="fiche_create_debut"
                       type="date"
                       bind:value={data.date_debut}
                       class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
                <div class="p-5"></div>
            </div>

            <div class="flex-1 flex flex-col pl-1">
                <label for="fiche_create_fin">date de fin</label>
                <input id="fiche_create_fin"
                       type="date"
                       bind:value={data.date_fin}
                       class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
                <div class="p-5"></div>
            </div>
        </div>

        <label for="fiche_create_porteur" class="text-xl">Porteur</label>
        <input id="fiche_create_porteur"
               bind:value={data.porteur}
               maxlength="100"
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100">
        <div class="p-5"></div>


        <label for="fiche_create_commentaire" class="text-xl">Commentaire</label>
        <textarea id="fiche_create_commentaire"
                  bind:value={data.commentaire}
                  class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"></textarea>
        <div class="p-5"></div>

        <label for="fiche_create_commentaire" class="text-xl">Actions du référentiel</label>
        <!-- {#if flatActions}
            <MultiSelect id='lang' bind:value={data.referentiel_action_ids}>
                {#each flatActions as action}
                    <option value="{action.id}">({action.id_nomenclature}) {action.nom}</option>
                {/each}
            </MultiSelect>
        {/if} -->

        {#if dialogContentLoaded }
            <div>
                <Button
                        size="small"
                        on:click={() => showLinkActionDialog = true }
                >
                    + Lier une action
                </Button>
            </div>
        {/if}

        <div class="p-10"></div>
        <Button full
                on:click={handleSave}
                classNames="md:w-1/3 self-end">
            Valider
        </Button>
    </form>

    {#if dialogContentLoaded }
        {#if showLinkActionDialog}
            <LinkActionDialog
                    actions={referentiels.actions}
                    thematiques={thematiques.thematiques}
                    on:LinkActionDialogClose={() => showLinkActionDialog = false }
            />
        {/if}
    {/if}
</section>