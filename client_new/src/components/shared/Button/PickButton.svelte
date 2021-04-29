<script lang="ts">
    /**
     * Picker button that can handle two different states
     */
    import ButtonIcon from './ButtonIcon.svelte'
    import Button from './Button.svelte'

    export let picked: boolean = false
    export let handlePick
    export let handleUnpick
    export let pickLabel
    export let unpickLabel
</script>

{#if picked}
    <Button size="small" on:click={() => handleUnpick()} classNames="mr-4 flex-none" colorVariant="pine">
        {unpickLabel}
    </Button>
{:else }
    <ButtonIcon on:click={() => handlePick()} classNames="mr-4 flex-none">
        {pickLabel}
    </ButtonIcon>
{/if}