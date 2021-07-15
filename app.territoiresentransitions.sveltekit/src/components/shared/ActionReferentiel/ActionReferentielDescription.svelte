<script lang="ts">
    import {ActionReferentiel} from "../../../generated/models/action_referentieliel";
    import ExpandPanel from "../../../../../components/ExpandPanel.svelte";
    import {onMount} from "svelte";

    export let action: ActionReferentiel

    let description = ''

    onMount(() => {
        description = action.description
    })
</script>

<style>
    .commentBlock {
        width: 50%;
    }

    .commentBlock :global(.fr-btn) {
        margin-top: 1rem;
    }
</style>

<div class="commentBlock">
    {#if description.trim().length }
        <ExpandPanel>
            <h2 slot="title">Description</h2>
            <div slot="content">
                {@html description}
            </div>
        </ExpandPanel>
    {/if}
</div>