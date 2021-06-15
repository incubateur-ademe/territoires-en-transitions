<script lang="ts">
    /**
     * Displays an indicateur an its yearly values.
     */
    import {IndicateurReferentiel} from "../../../../../generated/models/indicateur_referentiel";
    import IndicateurReferentielValueInput from "./IndicateurReferentielValueInput.svelte";
    import Angle from "../Angle.svelte";
    import {onMount} from "svelte";
    import {ActionReferentiel} from "../../../../../generated/models/action_referentiel";
    import ActionReferentielCard from "../ActionReferentiel/ActionReferentielCard.svelte";
    import IndicateurReferentielCommentaireArea from "./IndicateurReferentielCommentaireArea.svelte";

    export let indicateur: IndicateurReferentiel
    let relatedActions: ActionReferentiel[] = []
    let expanded = false
    const handleExpand = () => {
        expanded = !expanded
    }

    let years = [...Array(7).keys()].map(i => i + 2016) // 2016 to 2022

    const prettifyId = (id: string) => {
        return id.replace('cae-', '🌍 ').replace('eci-', '♻ ').replace(' 0', '')
    }

    onMount(async () => {
        const referentiel = await import('../../../../../generated/data/actions_referentiels')

        const found: ActionReferentiel[] = []
        for (let actionId of indicateur.action_ids) {
            const search = (actions: ActionReferentiel[], id: string) => {
                for (let action of actions) {
                    if (action.id == id) return action
                    const found = search(action.actions, id)
                    if (found) return found
                }
            }

            const action = search(referentiel.actions, actionId)
            if (action) found.push(action)
        }
        relatedActions = found;
    })
</script>

<section class="p-4 my-4 bg-white flex flex-col indicateur"
         id="indicateur-{indicateur.id}">

    <div class="flex flex-col lg:flex-row items-start">
        <div class="flex-1 flex flex-row cursor-pointer items-stretch mr-4"
             on:click={handleExpand}>
            <h3 class="flex flex-row items-stretch">
                <span class="mr-4 flex whitespace-nowrap">{ prettifyId(indicateur.id) }</span>
                <span class="mr-4 flex">{ indicateur.nom }</span>
            </h3>
            <Angle direction="{expanded ? 'down' : 'right' }"/>
        </div>


        <form class="flex-1 flex flex-row"
              data-component="indicatorForm">
            {#each years as year}
                <div class="flex-grow ml-2">
                    <IndicateurReferentielValueInput indicateur={indicateur} year={year}/>
                </div>
            {/each}
        </form>
    </div>


    <div class="description lg:w-2/3 mt-4"
         class:hidden="{!expanded}">

        <div class="pb-2"></div>
        <h4 class="text-lg mt-4 mb-2">Description</h4>
        {@html indicateur.description }

        <div class="pb-2"></div>
        <h4 class="text-lg mt-4 mb-2">Actions liées</h4>
        {#each relatedActions as action}
            <ActionReferentielCard action={action} link/>
        {/each}

        <div class="pb-5"></div>
        <IndicateurReferentielCommentaireArea indicateur={indicateur}/>
    </div>

</section>
