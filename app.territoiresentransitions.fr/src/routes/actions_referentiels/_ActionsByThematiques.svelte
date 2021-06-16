<script lang="ts">
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";

    import {Thematique, thematiques} from "../../../../generated/data/thematiques";
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

<style>
    section + section {
        margin-top: 3.75rem;
    }
</style>

{#each [...displayedByThematique] as [thematique, actions]}
    <section>
        <h2>{thematique.name}</h2>
        {#each actions as action}
            {#if searching}
                <ActionReferentielCard action={action} ficheButton expandButton statusBar/>
            {:else }
                <ActionReferentielCard action={action} link/>
            {/if}
        {/each}
    </section>
{/each}
