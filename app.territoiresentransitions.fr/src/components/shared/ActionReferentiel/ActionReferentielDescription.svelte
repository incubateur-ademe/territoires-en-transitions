<script lang="ts">
    import {ActionReferentiel} from "../../../../../generated/models/action_referentiel";
    import ExpandPanel from "../../../../../components/ExpandPanel.svelte";

    export let action: ActionReferentiel
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
    {#if action.description.trim().length }
        <ExpandPanel>
            <h2 slot="title">Description</h2>
            <div slot="content">
                {@html action.description}
            </div>
        </ExpandPanel>
    {/if}
</div>