<script lang="ts">
    /**
     * List indicateurs per catégorie.
     */
    import {IndicateurReferentiel} from "../../../generated/models/indicateur_referentiel";
    import {indicateurs} from "../../../generated/data/indicateurs_referentiels";
    import IndicateurReferentielCard from "../../components/shared/IndicateurReferentielCard.svelte";
    import {Thematique, thematiques} from "../../../generated/data/thematiques";
    import {onMount} from "svelte";

    let byThematique = new Map<Thematique, IndicateurReferentiel[]>()

    onMount(async () => {
        // Build components in browser, to avoid serving an heavy html file
        let map = new Map<Thematique, IndicateurReferentiel[]>()
        for (let thematique of thematiques) {
            const filtered = indicateurs.filter((action) => action.thematique_id === thematique.id)
            if (filtered.length) map.set(thematique, filtered)
        }
        byThematique = map
    })
</script>

{#each [...byThematique] as [thematique, indicateurs]}
    <h2 class="text-2xl mt-10 mb-2">{thematique.name}</h2>
    {#each indicateurs as indicateur}
        <IndicateurReferentielCard indicateur={indicateur}/>
    {/each}
{/each}
