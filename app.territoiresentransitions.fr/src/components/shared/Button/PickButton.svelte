<script lang="ts">
    /**
     * Picker button that can handle two different states
     */
    import ButtonIcon from './ButtonIcon.svelte'
    import Button from './Button.svelte'

    // Show Button or ButtonIcon depending on the state of this value
    export let picked: boolean = false

    // Handle pick callback
    export let handlePick: () => void = () => {}

    // Handle unpick callbakc
    export let handleUnpick: () => void = () => {}

    // Define label for unpicked state
    export let pickLabel: string = '+'

    // Define label for picked state
    export let unpickLabel: string = 'Ajouté'
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