<script lang="ts">
    /**
     * List indicateurs per catégorie.
     */
    import {IndicateurReferentiel} from "../../../../generated/models/indicateur_referentiel";
    import {indicateurs} from "../../../../generated/data/indicateurs_referentiels";
    import IndicateurReferentielCard
        from "../../components/shared/IndicateurReferentiel/IndicateurReferentielCard.svelte";
    import {Thematique, thematiques} from "../../../../generated/data/thematiques";
    import {onMount} from "svelte";
    import IndicateursSearchBar from "../../components/shared/IndicateursSearchBar.svelte";
    import IndicateurPersonnaliseList
        from "../../components/shared/IndicateurPersonnalise/IndicateurPersonnaliseList.svelte"
    import SelectInput from "../../components/shared/Forms/SelectInput.svelte";

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

<style>
    .pageIntro {
        margin-top: 2.25rem;
        margin-bottom: 3.75rem;
    }

    .pageIntro > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .pageIntro > div + div {
        margin-top: 1.875rem;
    }

    .pageIntro h1 {
        margin-bottom: 0;
    }

    .indicator {
        max-width: 75%;
        margin-top: 2rem;
    }

    .indicator__title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2.5rem;
    }

    .indicator :global(details) {
        width: 70% !important;
    }
</style>

<div class="pageIntro">
    <div>
        <h1>
            Indicateurs
        </h1>

        <IndicateursSearchBar bind:matches={displayed} indicateurs={indicateurs} searchCallBack={update}/>
    </div>

    <div>
        <SelectInput>
            <option value="">Tri par thématique</option>
        </SelectInput>
    </div>
</div>

<IndicateurPersonnaliseList/>

{#each [...byThematique] as [thematique, indicateurs]}
    <div class="indicator">
        <div class="indicator__title">
            <h2>{thematique.name}</h2>
        </div>
        {#each indicateurs as indicateur}
            <IndicateurReferentielCard indicateur={indicateur}/>
        {/each}
    </div>
{/each}
