<script lang="ts">
    import type {ActionReferentiel} from "$generated/models/action_referentiel";

    import {actions} from "$generated/data/referentiels";
    import ActionsByThematiques from "./_ActionsByThematiques.svelte"
    import ActionsClimatAirEnergie from "./_ActionsClimatAirEnergie.svelte"
    import ActionsEconomieCirculaire from "./_ActionsEconomieCirculaire.svelte"
    import SelectInput from "$components/shared/Forms/SelectInput.svelte";

    let view: 'thematique' | 'eci' | 'cae' = 'eci'

    let allActions: ActionReferentiel[] = actions;
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
</style>

<div class="pageIntro">
    <div>
        <h1 class="fr-h1">
            Référentiels
        </h1>
        <!-- hidden until issues #160 #149 are fixed
        <ReferentielSearchBar actions={allActions} bind:matches={displayed}/>
        --->
    </div>

    <div>
        <SelectInput bind:value={view}>
            <option value='eci'>
                Économie Circulaire
            </option>
            <option value='cae'>
                Climat Air Énergie
            </option>
            <option value='thematique'>
                Thématiques
            </option>
        </SelectInput>
    </div>
</div>

{#if view === 'thematique'}
    <ActionsByThematiques displayed={allActions} searching={false}/>
{:else if view === 'cae'}
    <ActionsClimatAirEnergie displayed={allActions} searching={false}/>
{:else if view === 'eci'}
    <ActionsEconomieCirculaire displayed={allActions} searching={false}/>
{/if}
