<script lang="ts">
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";
    import ActionReferentielCard from "../../components/shared/ActionReferentiel/ActionReferentielCard.svelte";

    export let searching: boolean

    export let displayed: ActionReferentiel[]

    $: displayed, refresh()

    let displayedByDomaine: Map<ActionReferentiel, Map<ActionReferentiel, ActionReferentiel[]>>

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
            }
        }

        for (let domaine of domaines) {
            const domaineMap = new Map<ActionReferentiel, ActionReferentiel[]>()

            for (let sousDomaine of sousDomaines) {
                const actions = mesures.filter(
                    (mesure) => mesure.id.startsWith(domaine.id)
                        && mesure.id.startsWith(sousDomaine.id)
                )
                if (actions.length) domaineMap.set(sousDomaine, actions)
            }
            if (domaineMap.size) map.set(domaine, domaineMap)
        }
        displayedByDomaine = map;
    }

    refresh()
</script>


{#each [...displayedByDomaine] as [domaine, sous_domaines]}
    <h2 class="text-2xl font-bold mt-10 mb-2">{domaine.nom}</h2>
    {#each [...sous_domaines] as [sous_domaine, actions]}
        <h3 class="text-2xl mt-10 mb-2">{sous_domaine.nom}</h3>
        {#each actions as action}
            {#if searching}
                <ActionReferentielCard action={action} ficheButton emoji expandButton statusBar/>
            {:else }
                <ActionReferentielCard action={action} emoji link/>
            {/if}
        {/each}
    {/each}
    <div class="pb-6"></div>
{/each}
