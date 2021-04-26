<script lang="ts">
    /**
     * Displays an indicateur an its yearly values.
     */
    import {IndicateurReferentiel} from "../../../generated/models/indicateur_referentiel";
    import IndicateurReferentielValueInput from "./IndicateurReferentielValueInput.svelte";

    export let indicateur: IndicateurReferentiel

    let years = [...Array(7).keys()].map(i => i + 2016) // 2016 to 2022
</script>

<section
        class="p-4 rounded my-4 action grid grid-cols-1 lg:grid-cols-12 lg:gap-1 bg-white "
        id="indicateur-{indicateur.id}">

    <div class="relative lg:col-span-6">
        <h3 class="text-xl mb-6 pr-28">({indicateur.id}) { indicateur.nom }</h3>
        <details class="expandable">
            <summary
                    class="absolute top-0 right-0 border border-gray-400 rounded px-2 py-1
                                        cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500">
                Plus
            </summary>
            <div>
                { indicateur.description }
            </div>
        </details>
    </div>
    <form
            class="lg:col-span-6 lg:col-end-13 grid gap-4 grid-cols-{ years.length }"
            data-component="indicatorForm">
        {#each years as year}
            <IndicateurReferentielValueInput indicateur={indicateur} year={year}/>
        {/each}
    </form>
</section>