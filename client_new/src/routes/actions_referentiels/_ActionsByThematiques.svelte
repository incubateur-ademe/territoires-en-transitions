<script lang="ts">
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";

    import {Thematique, thematiques} from "../../../generated/data/thematiques";
    import ActionReferentielCard from "../../components/shared/ActionReferentiel/ActionReferentielCard.svelte";

    export let searching: boolean

    export let displayed: ActionReferentiel[]

    $: displayed, refresh()

    let displayedByThematique: Map<Thematique, ActionReferentiel[]>

    const refresh = () => {
        const map = new Map<Thematique, ActionReferentiel[]>()
        const shallow: ActionReferentiel[] = []

        for (let action of displayed) {
            for (let level1 of action.actions) {
                for (let level2 of level1.actions) {
                    if (level2.id.startsWith('economie_circulaire')) {
                        // mesure
                        shallow.push(level2)
                    } else {
                        for (let level3 of level2.actions) {
                            // actions
                            shallow.push(level3)
                        }
                    }
                }
            }
        }

        for (let thematique of thematiques) {
            const actions = shallow.filter((action) => action.thematique_id === thematique.id)
            if (actions.length) map.set(thematique, actions)
        }
        displayedByThematique = map;
    }

    refresh()
</script>

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

