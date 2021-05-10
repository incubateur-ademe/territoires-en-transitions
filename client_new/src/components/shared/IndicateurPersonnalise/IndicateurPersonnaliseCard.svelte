<script lang="ts">
    /**
     * Display an Indicateur Personnalisé and allow edition.
     */
    import {IndicateurPersonnalise} from "../../../../generated/models/indicateur_personnalise";
    import IndicateurForm from "./IndicateurPersonnaliseForm.svelte"
    import Angle from "../Angle.svelte";
    import Button from "../Button/Button.svelte";
    import IndicateurPersonnaliseValueInput from "./IndicateurPersonnaliseValueInput.svelte";

    export let indicateur: IndicateurPersonnalise

    // When editing the form is displayed instead of the card.
    let editing = false

    let years = [...Array(7).keys()].map(i => i + 2016) // 2016 to 2022

    // When expanded the description is visible.
    let expanded = false
    const handleExpand = () => {
        expanded = !expanded
    }

    const handleEdit = (_) => {
        editing = true
    }

    const onSave = async (_) => {
        // the actual saving of the data is done by the form component.
        editing = false
    }
</script>

{#if editing}
    <div class="bg-gray-200 p-4 mt-2 mb-5">
        <h5 class="text-lg">Modifier l'indicateur</h5>
        <div class="pb-5"></div>
        <IndicateurForm bind:data={indicateur} on:save={onSave}/>
    </div>
{:else }
    <section class="p-4 my-4 bg-white flex flex-col indicateur">
        <div class="flex flex-col">
            <div class="flex flex-col lg:flex-row items-start w-full">
                <div class="flex flex-row flex-1 items-center">
                    <div class="flex-1 flex flex-row cursor-pointer items-stretch mr-4"
                         on:click={handleExpand}>
                        <h3 class="flex flex-row items-stretch">
                            <span class="mr-2 flex">{ indicateur.nom }</span>
                            {#if indicateur.unite }
                                <span class="mr-2 flex">({ indicateur.unite })</span>
                            {/if}
                        </h3>
                        <div class="ml-2 flex">
                            <Angle direction="{expanded ? 'down' : 'right' }"/>
                        </div>
                    </div>
                </div>
                <div class="flex flex-row flex-1">
                    {#each years as year}
                        <div class="flex-grow ml-2">
                            <IndicateurPersonnaliseValueInput indicateur={indicateur} year={year}/>
                        </div>
                    {/each}
                </div>
            </div>

            <div class="flex flex-col lg:w-1/2 mt-4"
                 class:hidden="{!expanded}">
                <div class="flex">
                    {indicateur.description}
                </div>
                <div class="flex mb-5"></div>

                <div class="flex">
                    <Button on:click={handleEdit}>Modifier l'indicateur</Button>
                </div>

            </div>
        </div>
    </section>
{/if}
