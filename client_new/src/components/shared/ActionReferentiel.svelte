<script lang="ts">
    import ActionStatus from "./ActionStatus.svelte";
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";

    export let action: ActionReferentiel

    let renderNested = false
    const handleMore = () => {
        renderNested = true
    }

    let epciId = ''
    onMount(async () => {
        epciId = getCurrentEpciId()
    })
</script>

<section
        class="p-4 rounded my-4 action grid grid-cols-1 lg:grid-cols-12 lg:gap-1 bg-white "
        id="action-{action.id}">

    <div class="relative lg:col-span-7">
        <a href="fiches/creation/?epci_id={epciId}&action_id={action.id}">[nouvelle fiche action]+</a>
        <h3 class="pr-28">({action.id}) {action.nom}</h3>
        <details class="expandable">
            <summary
                    class="border border-gray-400 rounded
             px-2 py-1 absolute top-0 right-0
             cursor-pointer hover:bg-gray-200"
                    on:click={handleMore}>
                Plus
            </summary>
            <div class="details-content whitespace-pre">
                {action.description}
            </div>

            {#if renderNested}
                {#each action.actions as action}
                    <svelte:self action={action}/>
                {/each}
            {/if}
        </details>
    </div>
    <ActionStatus actionId={action.id}/>
</section>
