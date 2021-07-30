<script lang="ts">
    import type {ActionReferentiel} from "$generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "$api/currentEpci";
    import ReferentielSearchBar from "$components/shared/ReferentielSearchBar.svelte";
    import {indicateurs} from "$generated/data/indicateurs_referentiels";
    import IndicateurReferentielCard
        from "$components/shared/IndicateurReferentiel/IndicateurReferentielCard.svelte";
    import ActionReferentielCard from "$components/shared/ActionReferentiel/ActionReferentielCard.svelte";
    import ExpandPanel from "$components/ExpandPanel.svelte";
    import ProgressStat from "$components/shared/ActionReferentiel/ProgressStat.svelte";

    export let action: ActionReferentiel

    let displayed = action.actions
    let epciId = ''
    let description = ''

    const isIndicateurRelatedToAction = (indicateur) => indicateur.action_ids.includes(action.id)
    const actionIndicateurs = indicateurs.filter(isIndicateurRelatedToAction)
    const hasIndicateurs = actionIndicateurs.length > 0

    onMount(async () => {
        epciId = getCurrentEpciId()
        description = action.description
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

    .pageIntro h1 {
        margin-bottom: 0;
    }

    .pageIntro__titleWithActions {
        display: flex;
        margin-bottom: 1.875rem;;
    }

    .pageIntro__titleWithActions > div {
        max-width: 75%;
    }

    .pageIntro__description :global(p) {
        margin-bottom: 0;
    }

    [name="title"] {
        font-size: 1rem;
    }

    .pageIntro > :global( * + *) {
        margin-top: 1.875rem;
    }

    .pageIntro > :global(details) {
        width: 70% !important;
    }

    .listActions {
        margin-bottom: 3.75rem;
    }
</style>

<div class="pageIntro">
    <div>
        <a class="fr-link fr-fi-arrow-left-line fr-link--icon-left" href="/actions_referentiels/?epci_id={epciId}">Retour</a>

        <ReferentielSearchBar actions={action.actions} bind:matches={displayed}/>
    </div>

    <div class="pageIntro__titleWithActions">
        <div>
            <h1 class="fr-h1">{action.id_nomenclature} {action.nom}</h1>
        </div>

        <div>
            <a class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-file-fill fr-btn--icon-left"
               href="/fiches/creation/?epci_id={epciId}&action_id={action.id}">
                Ajouter à mes actions
            </a>
        </div>
    </div>

    <ProgressStat action={action}/>

    {#if description}
        <ExpandPanel>
            <h2 slot="title">Description</h2>
            <div slot="content" class="pageIntro__description">
                {@html description}
            </div>
        </ExpandPanel>
    {/if}
</div>

<h2 class="fr-h2">Les actions</h2>
<div class="listActions">
  {#each displayed as action}
      <ActionReferentielCard
        action={action}
        ficheButton
        statusBar
        expandButton
        borderedCard
        commentBlock
        recursive
      />
  {/each}
</div>

<h2 class="fr-h2">Les indicateurs</h2>
{#if hasIndicateurs }
    {#each actionIndicateurs as indicateur (indicateur.id)}
        <IndicateurReferentielCard indicateur={indicateur}/>
    {/each}
{:else }
    Il n'existe pas d'indicateur dans le référentiel pour ces actions.
{/if}
