<script lang="ts">
    /**
     * Displays an indicateur an its yearly values.
     */
    import type {IndicateurReferentiel} from "$generated/models/indicateur_referentiel";
    import IndicateurReferentielValueInput from "./IndicateurReferentielValueInput.svelte";
    import {onMount} from "svelte";
    import type {ActionReferentiel} from "$generated/models/action_referentiel";
    import IndicateurReferentielCommentaireArea from "./IndicateurReferentielCommentaireArea.svelte";
    import RowCard from "../RowCard.svelte";
    import ExpandPanel from "$components/ExpandPanel.svelte";
    import {getCurrentEpciId} from "$api/currentEpci";

    export let indicateur: IndicateurReferentiel
    let relatedActions: ActionReferentiel[] = []
    let expanded = false
    let epciId = ''
    const handleExpand = () => {
        expanded = !expanded
    }

    let years = [...Array(7).keys()].map(i => i + 2016) // 2016 to 2022

    const prettifyId = (id: string) => {
        return id.replace('cae-', '').replace('eci-', '').replace(' 0', '')
    }

    onMount(async () => {
        epciId = getCurrentEpciId()
        const referentiel = await import('$generated/data/actions_referentiels')

        const found: ActionReferentiel[] = []
        for (let actionId of indicateur.action_ids) {
            const search = (actions: ActionReferentiel[], id: string) => {
                for (let action of actions) {
                    if (action.id == id) return action
                    const found = search(action.actions, id)
                    if (found) return found
                }
            }

            const action = search(referentiel.actions, actionId)
            if (action) found.push(action)
        }
        relatedActions = found;
    })
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

</style>

<RowCard id="indicateur-{indicateur.id}" bordered>
    <div class="RowCard__title">
        <h3 class="fr-h3">
            { prettifyId(indicateur.id) } { indicateur.nom }
        </h3>
        <!-- indicateurs are not modifiable
        <button class="fr-btn fr-btn--secondary">Modifier</button>
        -->
    </div>

    <form class="indicatorRow">
        <div class="indicatorRow__carousel">
            <!-- issue #43
            <button class="fr-btn fr-btn--secondary fr-fi-arrow-left-line" title="Précédent"></button>
            -->

            <div class="indicatorRow__yearsList">
                {#each years as year}
                    <div>
                        <IndicateurReferentielValueInput indicateur={indicateur} year={year}/>
                    </div>
                {/each}
            </div>
            <!-- issue #43
            <button class="fr-btn fr-btn--secondary fr-fi-arrow-right-line" title="Suivant"></button>
            -->
        </div>

        <!-- hidden until a valid solution is found
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

    <ExpandPanel>
        <h3 slot="title">
            Description
        </h3>

        <div slot="content">
            {@html indicateur.description }

            {#if relatedActions}
                <h3 class="fr-h3">Actions liées</h3>

                <ul>
                    {#each relatedActions as action}
                        <li>
                            <a
                                    href="/actions_referentiels/{action.id}/?epci_id={epciId}#{action.id}"
                                    class="fr-link fr-fi-arrow-right-line fr-link--icon-right"
                                    rel="prefetch"
                            >

                                {action.id_nomenclature} -
                                {action.nom}
                            </a>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </ExpandPanel>

    <ExpandPanel>
        <h3 slot="title">Commentaire</h3>
        <IndicateurReferentielCommentaireArea indicateur={indicateur} slot="content"/>
    </ExpandPanel>

</RowCard>
