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

<div class="flex flex-row items-center
            bg-white px-5 py-5 mb-5 ">
    <div class="flex-grow flex flex-row items-center">
        <h1>
            Référentiels
        </h1>
        <div class="pl-2"></div>
        <div class="w-1/2">
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
    <div>
        <ReferentielSearchBar actions={allActions} bind:matches={displayed}/>
    </div>


</div>

{#if view === 'thematique'}
    <ActionsByThematiques displayed={displayed} searching={searching}/>
{:else if view === 'cae'}
    <ActionsClimatAirEnergie displayed={displayed} searching={searching}/>
{:else if view === 'eci'}
    <ActionsEconomieCirculaire displayed={displayed} searching={searching}/>
{/if}
