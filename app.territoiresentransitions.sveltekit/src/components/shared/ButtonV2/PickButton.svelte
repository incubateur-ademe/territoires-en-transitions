<script lang="ts">
    /**
     * Picker button that can handle two different states
     */

    // Show Button or ButtonIcon depending on the state of this value
    export let picked: boolean = false

    // Handle pick callback
    export let handlePick: () => void = () => {}

    // Handle unpick callbakc
    export let handleUnpick: () => void = () => {}

    // Define label for unpicked state
    export let pickLabel: string = 'Ajouter'

    // Define label for picked state
    export let unpickLabel: string = 'Supprimer'
</script>

<style>
    button {
        flex-shrink: 0;
    }
</style>

{#if picked}
    <button class="fr-btn fr-btn--sm" on:click|preventDefault={() => handleUnpick()}>
        {unpickLabel}
    </button>
{:else }
    <button class="fr-btn fr-btn--sm fr-btn--secondary" on:click|preventDefault={() => handlePick()}>
        {pickLabel}
    </button>
{/if}