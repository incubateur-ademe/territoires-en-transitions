<script lang="ts">
    /**
     * Displays an indicateur an its yearly values.
     */
    import {IndicateurReferentiel} from "../../../generated/models/indicateur_referentiel";
    import IndicateurReferentielValueInput from "./IndicateurReferentielValueInput.svelte";
    import Angle from "./Angle.svelte";

    export let indicateur: IndicateurReferentiel
    let expanded = false
    const handleExpand = () => {
        expanded = !expanded
    }

    let years = [...Array(7).keys()].map(i => i + 2016) // 2016 to 2022
</script>

<section class="p-4 my-4 bg-white flex flex-col indicateur"
         id="indicateur-{indicateur.id}">

    <div class="flex flex-col lg:flex-row items-start">
        <div class="flex-1 flex flex-row cursor-pointer items-stretch mr-4"
             on:click={handleExpand}>
            <h3 class="flex text-xl mr-4">({indicateur.id}) { indicateur.nom }</h3>
            <Angle direction="{expanded ? 'down' : 'right' }"/>
        </div>


        <form class="flex-1 flex flex-row"
              data-component="indicatorForm">
            {#each years as year}
                <div class="flex-grow ml-2">
                    <IndicateurReferentielValueInput indicateur={indicateur} year={year}/>
                </div>
            {/each}
        </form>
    </div>


    <div class="description lg:w-1/2 mt-4"
         class:hidden="{!expanded}">
        {@html indicateur.description }
    </div>

</section>