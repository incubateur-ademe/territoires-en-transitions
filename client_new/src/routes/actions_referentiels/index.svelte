<script lang="ts">
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import ReferentielSearchBar from "../../components/shared/ReferentielSearchBar.svelte";

    import {actions} from "../../../generated/data/actions_referentiels";
    import ActionsByThematiques from "./_ActionsByThematiques.svelte"
    import ActionsClimatAirEnergie from "./_ActionsClimatAirEnergie.svelte"
    import ActionsEconomieCirculaire from "./_ActionsEconomieCirculaire.svelte"

    let view: 'thematique' | 'eci' | 'cae' = 'thematique'

    let allActions: ActionReferentiel[] = actions;
    let displayed: ActionReferentiel[] = actions;

    $: searching = allActions.length != displayed.length
</script>

<div class="flex flex-row items-center
            bg-white px-5 py-5 mb-5 ">
    <div class="flex-grow">
        Référentiels
    </div>
    <div>
        <ReferentielSearchBar actions={allActions} bind:matches={displayed}/>
    </div>

</div>

{#if view === 'thematique'}
    <ActionsByThematiques displayed={displayed} searching={searching}/>
{:else if view === 'cae'}
    <ActionsClimatAirEnergie displayed={displayed} searching={searching}/>
{:else if view === 'eci'}
    <ActionsEconomieCirculaire displayed={displayed} searching={searching}/>
{/if}

