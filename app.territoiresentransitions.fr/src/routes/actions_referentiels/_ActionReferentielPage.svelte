<script lang="ts">
    import {ActionReferentiel} from "../../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import ReferentielSearchBar from "../../components/shared/ReferentielSearchBar.svelte";
    import {indicateurs} from "../../../../generated/data/indicateurs_referentiels";
    import IndicateurReferentielCard
        from "../../components/shared/IndicateurReferentiel/IndicateurReferentielCard.svelte";
    import ActionReferentielCard from "../../components/shared/ActionReferentiel/ActionReferentielCard.svelte";
    import ProgressStat from "../../../../components/ProgressStat.svelte";
    import ExpandPanel from "../../../../components/ExpandPanel.svelte";

    export let action: ActionReferentiel

    let displayed = action.actions
    let epciId = ''
    let description = ''

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

    .pageIntro > div + div {
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

    .pageIntro > :global( div + div) {
        margin-top: 1.875rem;
    }
</style>

<div class="pageIntro">
    <div>
        <a class="fr-link fr-fi-arrow-left-line fr-link--icon-left" href="#">Retour</a>

        <ReferentielSearchBar actions={action.actions} bind:matches={displayed}/>
    </div>

    <div class="pageIntro__titleWithActions">
        <div>
            <h1>{action.id_nomenclature} {action.nom}</h1>
        </div>

        <div>
            <a class="fr-btn fr-btn--secondary fr-btn--sm fr-fi-file-fill fr-btn--icon-left"
               href="fiches/creation/?epci_id={epciId}&action_id={action.id}">
                Créer une fiche-action
            </a>
        </div>
    </div>

    <ProgressStat state={"alert"}/>

    <div>
        {#if action.description}
            <ExpandPanel>
                <h2 slot="title">Description</h2>
                <div slot="content" class="pageIntro__description">
                    <h3>Un titre</h3>
                    {@html action.description}
                </div>
            </ExpandPanel>
        {/if}
    </div>
</div>

<h2>Les actions</h2>
{#each displayed as action}
    <ActionReferentielCard action={action} ficheButton statusBar expandButton borderedCard commentBlock recursive/>
{/each}

<h2>Les indicateurs</h2>
{#each indicateurs.filter((indicateur) => indicateur.action_ids.includes(action.id)) as indicateur (indicateur.id)}
    <IndicateurReferentielCard indicateur={indicateur}/>
{/each}
