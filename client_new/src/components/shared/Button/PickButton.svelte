<script lang="ts">
    /**
     * Picker button that can handle two different states
     */
    import ButtonIcon from './ButtonIcon.svelte'
    import Button from './Button.svelte'

    export let isAdded: boolean = false
    export let handlePick
    export let handleUnpick
    export let pickLabel
    export let unpickLabel
</script>

{#if isAdded}
    <Button small on:click={handleUnpick} classNames="mr-4" colorVariant="pine">
        {unpickLabel}
    </Button>
{:else }
    <ButtonIcon on:click={handlePick} classNames="mr-4">
        {pickLabel}
    </ButtonIcon>
{/if}
