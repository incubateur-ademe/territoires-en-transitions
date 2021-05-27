<script lang="ts">
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import ReferentielSearchBar from "../../components/shared/ReferentielSearchBar.svelte";

    import {actions} from "../../../generated/data/referentiels.ts";
    import ActionsByThematiques from "./_ActionsByThematiques.svelte"
    import ActionsClimatAirEnergie from "./_ActionsClimatAirEnergie.svelte"
    import ActionsEconomieCirculaire from "./_ActionsEconomieCirculaire.svelte"
    import {onMount} from "svelte";
    import {testUIVisibility} from "../../api/currentEnvironment";
    import Button from "../../components/shared/Button/Button.svelte";

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
    <div class="flex-grow">
        Référentiels
    </div>
    <div>
        <ReferentielSearchBar actions={allActions} bind:matches={displayed}/>
    </div>


</div>

    {#if referentielsVisibility}
<div class="flex flex-row items-center
            bg-white px-5 py-5 mb-5
            border-l-8 border-pink-600">

            <Button on:click={() => view = 'thematique'}
                    colorVariant="{view === 'thematique' ? 'ash' : 'nettle'}">
                Thématiques
            </Button>

            <Button on:click={() => view = 'eci'}
                    colorVariant="{view === 'eci' ? 'ash' : 'nettle'}">
                Economie circulaire
            </Button>

            <Button on:click={() => view = 'cae'}
                    colorVariant="{view === 'cae' ? 'ash' : 'nettle'}">
                Climat air energie
            </Button>
</div>
    {/if}
{#if view === 'thematique'}
    <ActionsByThematiques displayed={displayed} searching={searching}/>
{:else if view === 'cae'}
    <ActionsClimatAirEnergie displayed={displayed} searching={searching}/>
{:else if view === 'eci'}
    <ActionsEconomieCirculaire displayed={displayed} searching={searching}/>
{/if}

