<script lang="ts">
    /**
     * Display an Indicateur Personnalisé and allow edition.
     */
    import IndicateurForm from "./IndicateurPersonnaliseForm.svelte"
    import IndicateurPersonnaliseValueInput from "./IndicateurPersonnaliseValueInput.svelte";
    import RowCard from "../RowCard.svelte";
    import ExpandPanel from "$components/ExpandPanel.svelte";
    import type { IndicateurPersonnaliseStorable } from "$storables/IndicateurPersonnaliseStorable";

    export let indicateur: IndicateurPersonnaliseStorable

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

<style>
    .indicatorRow {
        display: flex;
        margin-bottom: 2.5rem;
    }

    .indicatorRow__carousel {
        display: flex;
        align-items: flex-end;
    }

    .indicatorRow__carousel .fr-btn {
        box-shadow: none;
        flex-shrink: 0;

        /* caché tant que non fonctionnel */
        display: none;
    }

    .indicatorRow__yearsList {
        position: relative;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-column-gap: 1.25rem;
        padding: 0 1.5rem;
    }

    .indicatorRow :global(input) {
        margin-top: .5rem;
    }

    .indicatorRow__target {
        margin-left: 1.5rem;
    }

    .indicatorRow__target .fr-input {
        box-shadow: inset 0 -2px 0 0 var(--bf500);
    }

    label.objectif {
        font-weight: bold;
    }

    .RowCard__title {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .RowCard__title h3 {
        width: 75%;
    }

    .description :global(details) {
        max-width: 70%;
    }
</style>

{#if editing}
    <RowCard bordered>
        <h5 class="text-lg">Modifier l'indicateur</h5>
        <IndicateurForm bind:data={indicateur} on:save={onSave}/>
    </RowCard>
{:else }
    <RowCard>
        <div class="RowCard__title">
            <h3 class="fr-h3">
                { indicateur.nom }
                {#if indicateur.unite }
                    ({ indicateur.unite })
                {/if}
            </h3>

            <button class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-edit-fill" title="Modifier l'indicateur"
                on:click|preventDefault={handleEdit}></button>
        </div>

        <form class="indicatorRow">
            <div class="indicatorRow__carousel">
                <button class="fr-btn fr-btn--secondary fr-fi-arrow-left-line" title="Précédent"></button>

                <div class="indicatorRow__yearsList">
                    {#each years as year}
                        <div>
                            <IndicateurPersonnaliseValueInput indicateur={indicateur} year={year}/>
                        </div>
                    {/each}
                </div>

                <button class="fr-btn fr-btn--secondary fr-fi-arrow-right-line" title="Suivant"></button>
            </div>

            <!-- Pas validé métier
            <div class="indicatorRow__target">
                <label for="objectif" class="objectif">
                    Objectif
                    <input class="fr-input"
                           id="objectif"
                           type="text"
                    />
                </label>
            </div>
            -->
        </form>

        {#if indicateur.description}
            <div class="description">
                <ExpandPanel>
                    <h3 slot="title">
                        Description
                    </h3>

                    <div slot="content">
                        {@html indicateur.description }
                    </div>
                </ExpandPanel>
            </div>
        {/if}

    </RowCard>
{/if}
