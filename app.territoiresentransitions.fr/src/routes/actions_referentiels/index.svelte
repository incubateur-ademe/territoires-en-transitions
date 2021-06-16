<script lang="ts">
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";
    import ReferentielSearchBar from "../../components/shared/ReferentielSearchBar.svelte";

    import {actions} from "../../../../generated/data/referentiels.ts";
    import ActionsByThematiques from "./_ActionsByThematiques.svelte"
    import ActionsClimatAirEnergie from "./_ActionsClimatAirEnergie.svelte"
    import ActionsEconomieCirculaire from "./_ActionsEconomieCirculaire.svelte"
    import {onMount} from "svelte";
    import {testUIVisibility} from "../../api/currentEnvironment";
    import SelectInput from "../../components/shared/Forms/SelectInput.svelte";

    let view: 'thematique' | 'eci' | 'cae' = 'thematique'

    let allActions: ActionReferentiel[] = actions;
    let displayed: ActionReferentiel[] = actions;
    let referentielsVisibility: boolean = false

    $: searching = allActions.length != displayed.length

    onMount(() => {
        referentielsVisibility = testUIVisibility()
    })
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
        <h1>
            Référentiels
        </h1>

        <ReferentielSearchBar actions={allActions} bind:matches={displayed}/>
    </div>

    <div>
        <SelectInput bind:value={view}>
            <option value='thematique'>
                Thématiques
            </option>
            <option value='eci'>
                Économie Circulaire
            </option>
            <option value='cae'>
                Climat Air Énergie
            </option>
        </SelectInput>
    </div>
</div>

{#if view === 'thematique'}
    <ActionsByThematiques displayed={displayed} searching={searching}/>
{:else if view === 'cae'}
    <ActionsClimatAirEnergie displayed={displayed} searching={searching}/>
{:else if view === 'eci'}
    <ActionsEconomieCirculaire displayed={displayed} searching={searching}/>
{/if}
