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
    import {HybridStore} from "../../api/hybridStore"
    import {testUIVisibility} from "../../api/currentEnvironment";
    import {IndicateurReferentiel} from "../../../generated/models/indicateur_referentiel";
    import IndicateurReferentielCard from "../../components/shared/IndicateurReferentielCard.svelte";

    export let data: FicheActionInterface

    let ficheActionStore: HybridStore<FicheActionStorable>

    let showLinkActionDialog = false
    let useDialogPicker = false
    let useIndicateurs = false

    // hack fix https://lte.jetbrains.space/p/territoires-en-transitions/issues/302
    let budget: number | string = data.budget

    // Save the form data
    const handleSave = async () => {
        if (!data.custom_id) return;
        data.budget = Number.parseFloat(budget.toString()) || 0
        const fiche = new FicheActionStorable(data)
        const saved = await ficheActionStore.store(fiche)

        if (saved.uid) window.location.href = `/fiches/?epci_id=${data.epci_id}`
        else window.alert('Une erreur est survenue lors de la sauvegarde de la fiche action.')
    }

    let indicateursReferentiel: IndicateurReferentiel[]

    // Helper to check reactively if an action is linked to the current fiche
    const isActionLinkedToFiche = (actionId) => data.referentiel_action_ids.includes(actionId)

    // Update the array of action ids linked to the current fiche
    const toggleActionIdInData = (actionId) => {
        const actionIds = data.referentiel_action_ids

        if (isActionLinkedToFiche(actionId)) {
            const newActionIds = actionIds.filter((id) => id != actionId)
            data.referentiel_action_ids = newActionIds
            return
        }

        data.referentiel_action_ids = [...actionIds, actionId]
    }

    onMount(async () => {
        // initialize store
        const hybridStores = await import ("../../api/hybridStores");
        ficheActionStore = hybridStores.ficheActionStore;

        // load référentiel indicateurs
        const indicateurs = await import("../../../generated/data/indicateurs_referentiels")
        indicateursReferentiel = indicateurs.indicateurs

        // show test ui
        useDialogPicker = useIndicateurs = testUIVisibility()
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


        <div class="p-5"></div>
        <div class="text-xl">Référentiels</div>
        <div class="my-2 p-2">
            {#await import('./_LinkedActions.svelte') then c}
                <svelte:component this={c.default}
                                  actionIds={data.referentiel_action_ids}
                                  handlePickButton={toggleActionIdInData}
                />
            {/await}
            <Button on:click={() => showLinkActionDialog = true }
                    size="small">
                + Lier une action
            </Button>
        </div>

        <div class="p-5"></div>
        <div class="my-2 p-2">
            <div class="text-xl mb-4">Indicateurs</div>
            {#if indicateursReferentiel}
                <MultiSelect id='fiche_create_indicateurs' bind:value={data.referentiel_indicateur_ids}>
                    {#each indicateursReferentiel as indicateur}
                        <option value="{indicateur.id}">({indicateur.id}) {indicateur.nom}</option>
                    {/each}
                </MultiSelect>

                {#each data.referentiel_indicateur_ids as indicateurId}
                    <div class="shadow">
                        <IndicateurReferentielCard
                                indicateur={indicateursReferentiel.filter((i) => i.id === indicateurId)[0]}/>
                    </div>
                {/each}
            {/if}
        </div>


        <div class="p-5"></div>
        <Button classNames="md:w-1/3 self-end"
                full
                on:click={handleSave}>
            Valider
        </Button>
    </form>

    {#if showLinkActionDialog}
        {#await import('./linkActionDialog/_LinkActionDialog.svelte') then c}
            <svelte:component this={c.default}
                              on:LinkActionDialogClose={() => showLinkActionDialog = false }
                              handleActionButton={toggleActionIdInData}
                              isActionLinkedToFiche={isActionLinkedToFiche}
            />
        {/await}
    {/if}
</section>