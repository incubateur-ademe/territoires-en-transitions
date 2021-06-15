<script lang="ts">
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import ReferentielSearchBar from "../../components/shared/ReferentielSearchBar.svelte";
    import {indicateurs} from "../../../../generated/data/indicateurs_referentiels";
    import IndicateurReferentielCard from "../../components/shared/IndicateurReferentiel/IndicateurReferentielCard.svelte";
    import ActionReferentielCard from "../../components/shared/ActionReferentiel/ActionReferentielCard.svelte";

    export let action: ActionReferentiel

    let displayed = action.actions
    let epciId = ''
    let description = ''

    onMount(async () => {
        epciId = getCurrentEpciId()
        description = action.description
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
    {#if description}
        {@html description}
    {/if}
</div>

<h2 class="text-2xl font-semibold mt-8 mb-4 ">Les actions</h2>
{#each displayed as action}
    <ActionReferentielCard action={action} ficheButton statusBar expandButton/>
{/each}

<h2 class="text-2xl font-semibold mt-8 mb-4 ">Les indicateurs</h2>


{#each indicateurs.filter((indicateur) => indicateur.action_ids.includes(action.id)) as indicateur (indicateur.id)}
    <IndicateurReferentielCard indicateur={indicateur}/>
{/each}