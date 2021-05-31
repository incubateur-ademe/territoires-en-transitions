<script lang="ts">
    /**
     * List indicateurs per catégorie.
     */
    import {IndicateurReferentiel} from "../../../../generated/models/indicateur_referentiel";
    import {indicateurs} from "../../../../generated/data/indicateurs_referentiels";
    import IndicateurReferentielCard from "../../components/shared/IndicateurReferentiel/IndicateurReferentielCard.svelte";
    import {Thematique, thematiques} from "../../../../generated/data/thematiques";
    import {onMount} from "svelte";
    import IndicateursSearchBar from "../../components/shared/IndicateursSearchBar.svelte";
    import IndicateurPersonnaliseList from "../../components/shared/IndicateurPersonnalise/IndicateurPersonnaliseList.svelte"

    let byThematique = new Map<Thematique, IndicateurReferentiel[]>()
    let displayed: IndicateurReferentiel[] = indicateurs

    onMount(async () => {
        update();
    })

    const update = () => {
        // Build components in browser, to avoid serving an heavy html file
        let map = new Map<Thematique, IndicateurReferentiel[]>()
        for (let thematique of thematiques) {
            const filtered = displayed.filter((action) => action.thematique_id === thematique.id)
            if (filtered.length) map.set(thematique, filtered)
        }
        byThematique = map
    }
</script>

<div class="flex flex-row items-center
            bg-white px-5 py-5 mb-5 ">
    <div class="flex-grow">
        Indicateurs
    </div>
    <div>
        <IndicateursSearchBar bind:matches={displayed} indicateurs={indicateurs} searchCallBack={update}/>
    </div>
</div>

<IndicateurPersonnaliseList/>

{#each [...byThematique] as [thematique, indicateurs]}
    <h2 class="text-2xl mt-10 mb-2">{thematique.name}</h2>
    {#each indicateurs as indicateur}
        <IndicateurReferentielCard indicateur={indicateur}/>
    {/each}
{/each}
