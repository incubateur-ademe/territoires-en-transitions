<script lang="ts">
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import ReferentielSearchBar from "../../components/shared/ReferentielSearchBar.svelte";
    import ActionReferentielCard from "../../components/shared/ActionReferentielCard.svelte";

    import {actions} from "../../../generated/data/actions_referentiels";
    import {Thematique, thematiques} from "../../../generated/data/thematiques";

    let allActions: ActionReferentiel[] = actions;
    let displayed: ActionReferentiel[] = actions;
    let displayedByThematique = new Map<Thematique, ActionReferentiel[]>()

    $: searching = allActions.length != displayed.length
    $: displayed, refresh()


    const refresh = () => {
        const map = new Map<Thematique, ActionReferentiel[]>()
        for (let thematique of thematiques) {
            const actions = displayed.filter((action) => action.thematique_id === thematique.id)
            if (actions.length) map.set(thematique, actions)
        }
        displayedByThematique = map;
    }
    refresh()
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

{#each [...displayedByThematique] as [thematique, actions]}
    <h2 class="text-2xl mt-10 mb-2">{thematique.name}</h2>
    {#each actions as action}
        {#if searching}
            <ActionReferentielCard action={action} ficheButton emoji expandButton statusBar/>
        {:else }
            <ActionReferentielCard action={action} emoji link/>
        {/if}
    {/each}
{/each}

