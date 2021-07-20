<script lang="ts">
    import type {ActionReferentielScore} from "$generated/models/action_referentiel_score";
    import {onMount} from "svelte";
    import type {ActionReferentiel} from "$generated/models/action_referentiel";

    export let action: ActionReferentiel
    export let position = "left";
    let score: ActionReferentielScore
    let state = "alert";

    const updateState = () => {
        const percentage: number = score ? score.percentage * 100 : 0
        if (score && score.avancement.includes('non_concernee')) {
            state = "nc"
        }
        else if (percentage < 34) {
            state = "alert"
        }
        else if (percentage < 49) {
            state = "warning"
        }
        else if (percentage < 64) {
            state = "ok"
        }
        else if (percentage < 74) {
            state = "good"
        }
        else {
            state = "best"
        }
    }
    $:score, updateState();


    onMount(async () => {
        const stores = await import("$api/hybridStores")
        score = await stores.actionReferentielScoreStore.retrieveById(action.id)
    })
</script>

<style>
    div {
        padding-left: 0.75rem;
        font-size: 0.875rem;
        font-weight: normal;
        background-color: #fff;
        border-left: 6px solid #000;
    }

    strong {
        font-size: 1rem;
    }

    .progressBar--position-right {
        padding-right: 0.75rem;
        padding-left: 1.5rem;
        border-right: 6px solid #000;
        border-left: 0;
    }

    .progressBar--position-bottom {
        padding-left: 0;
        border-left: 0;
    }

    .progressBar--position-bottom::after {
        content: "";
        display: block;
        width: 50%;
        height: 6px;
        margin: 0 auto;
        background-color: #000;
    }

    .progressBar--status-nc,
    .progressBar--position-bottom.progressBar--status-nc {
        border-color: #444;
    }

    .progressBar--status-alert,
    .progressBar--position-bottom.progressBar--status-alert {
        border-color: #DA0505;
    }

    .progressBar--status-warning,
    .progressBar--position-bottom.progressBar--status-warning {
        border-color: #F59E0B;
    }

    .progressBar--status-ok,
    .progressBar--position-bottom.progressBar--status-ok {
        border-color: #FCD34D;
    }

    .progressBar--status-good,
    .progressBar--position-bottom.progressBar--status-good {
        border-color: #C0D72D;
    }

    .progressBar--status-best,
    .progressBar--position-bottom.progressBar--status-best {
        border-color: #059669;
    }
</style>

<div class={`progressBar--position-${position} progressBar--status-${state}`}>
    {#if score}
        <strong>{(score.percentage * 100).toFixed(1)}%</strong>
        ({score.points.toFixed(2)} / {score.potentiel.toFixed(2)})
    {:else }
        <strong>0%</strong>
        (../..)
    {/if}
</div>