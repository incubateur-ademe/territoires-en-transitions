<script lang="ts">
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import ActionReferentielCard from "./ActionReferentielCard.svelte";
    import ReferentielSearchBar from "./ReferentielSearchBar.svelte";

    export let action: ActionReferentiel
    let displayed = action.actions

    let renderNested = false
    const handleMore = () => {
        renderNested = true
    }

    let epciId = ''
    onMount(async () => {
        epciId = getCurrentEpciId()
    })
</script>

<div class="flex flex-row items-center
            bg-white px-5 py-5 mb-5 ">
    <div class="flex-grow">
        Mesure {action.id_nomenclature}
    </div>
    <div>
        <ReferentielSearchBar actions={action.actions} bind:matches={displayed}/>
    </div>
</div>

<ActionReferentielCard action={action} emoji ficheButton statusBar/>
<div class="m-4">
    {action.description}
</div>

<h2 class="text-2xl font-semibold mt-8 mb-4 ">Les actions</h2>
{#each displayed as action}
    <ActionReferentielCard action={action} ficheButton expandButton statusBar/>
{/each}

<h2 class="text-2xl font-semibold mt-8 mb-4 ">Les indicateurs</h2>