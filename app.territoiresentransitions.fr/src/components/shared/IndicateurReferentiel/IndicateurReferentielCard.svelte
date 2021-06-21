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
    import RowCard from "../RowCard.svelte";

    export let indicateur: IndicateurReferentiel
    let relatedActions: ActionReferentiel[] = []
    let expanded = false
    const handleExpand = () => {
        expanded = !expanded
    }

    let years = [...Array(7).keys()].map(i => i + 2016) // 2016 to 2022

    const prettifyId = (id: string) => {
        return id.replace('cae-', '').replace('eci-', '').replace(' 0', '')
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

<style>
    .indicatorRow {
        display: flex;
    }

    .indicatorRow > div:not(:first-child) {
        margin-left: 1.25rem;
    }
</style>

<RowCard id="indicateur-{indicateur.id}">

    <div class="flex flex-col lg:flex-row items-start">
        <div class="flex-1 flex flex-row cursor-pointer items-stretch mr-4"
             on:click={handleExpand}>
            <h3 class="flex flex-row items-stretch">
                <span class="mr-4 flex whitespace-nowrap">{ prettifyId(indicateur.id) }</span>
                <span class="mr-4 flex">{ indicateur.nom }</span>
            </h3>
            <Angle direction="{expanded ? 'down' : 'right' }"/>
        </div>

        <form class="indicatorRow">
            {#each years as year}
                <div>
                    <IndicateurReferentielValueInput indicateur={indicateur} year={year}/>
                </div>
            {/each}
        </form>
    </div>


    <div class="description"
         class:hidden="{!expanded}">

        <h4>Description</h4>
        {@html indicateur.description }

        <h4>Actions liées</h4>
        {#each relatedActions as action}
            <ActionReferentielCard action={action} link/>
        {/each}

        <IndicateurReferentielCommentaireArea indicateur={indicateur}/>
    </div>

</RowCard>
