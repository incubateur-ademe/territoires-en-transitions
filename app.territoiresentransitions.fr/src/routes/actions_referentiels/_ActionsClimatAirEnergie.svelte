<script lang="ts">
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";
    import ActionReferentielCard from "../../components/shared/ActionReferentiel/ActionReferentielCard.svelte";
    import ProgressStat from "../../../../components/ProgressStat.svelte";

    export let searching: boolean

    export let displayed: ActionReferentiel[]

    $: displayed, refresh()

    let displayedByDomaine: Map<ActionReferentiel, Map<ActionReferentiel, ActionReferentiel[]>>

    const sortById = (a: ActionReferentiel, b: ActionReferentiel) => {
        if (a.id_nomenclature > b.id_nomenclature) return 1
        if (a.id_nomenclature < b.id_nomenclature) return -1
        return 0
    }
    const refresh = () => {
        const map = new Map<ActionReferentiel, Map<ActionReferentiel, ActionReferentiel[]>>()
        const mesures: ActionReferentiel[] = []
        const sousDomaines: ActionReferentiel[] = []
        const domaines: ActionReferentiel[] = []

        for (let action of displayed) {
            if (action.id.startsWith('economie_circulaire')) continue
            for (let domaine of action.actions) {
                domaines.push(domaine)
                for (let sous_domaine of domaine.actions) {
                    sousDomaines.push(sous_domaine)
                    for (let mesure of sous_domaine.actions) {
                        mesures.push(mesure)
                    }
                }
                sousDomaines.sort(sortById)
            }
            domaines.sort(sortById)
        }

        for (let domaine of domaines) {
            const domaineMap = new Map<ActionReferentiel, ActionReferentiel[]>()

            for (let sousDomaine of sousDomaines) {
                const actions = mesures.filter(
                    (mesure) => mesure.id.startsWith(domaine.id)
                        && mesure.id.startsWith(sousDomaine.id)
                )

                actions.sort(sortById)
                if (actions.length) domaineMap.set(sousDomaine, actions)
            }
            if (domaineMap.size) map.set(domaine, domaineMap)
        }
        displayedByDomaine = map;
    }

    refresh()
</script>

<style>
    section + section {
        margin-top: 3.75rem;
    }

    section > div {
        margin-top: 2.5rem;
    }

    h3 {
        margin-bottom: 1.875rem;
    }

    h2,
    h3 {
        display: flex;
    }

    h2 :global([class^="progressBar"]),
    h3 :global([class^="progressBar"]) {
        margin-left: 1.5rem;
    }

    h2 :global([class^="progressBar"] strong),
    h3 :global([class^="progressBar"] strong) {
        font-size: 1.125rem;
    }

    h2 :global([class^="progressBar"]) {
        font-size: 1rem;
    }

</style>

{#each [...displayedByDomaine] as [domaine, sous_domaines]}
    <section>
        <h2>{domaine.id_nomenclature}. {domaine.nom}
            <!-- does not work yet for Climat Air Energie
            <ProgressStat position={"bottom"}/>
            --->
        </h2>
        {#each [...sous_domaines] as [sous_domaine, actions]}
            <div>
                <h3>{sous_domaine.id_nomenclature}. {sous_domaine.nom}
                    <!-- does not work yet for Climat Air Energie
                    <ProgressStat position={"bottom"}/>
                    --->
                </h3>
                {#each actions as action}
                    {#if searching}
                        <ActionReferentielCard action={action} ficheButton expandButton statusBar/>
                    {:else }
                        <ActionReferentielCard action={action} link/>
                    {/if}
                {/each}
            </div>
        {/each}
    </section>
{/each}
