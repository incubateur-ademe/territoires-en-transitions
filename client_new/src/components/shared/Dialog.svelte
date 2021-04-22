<script lang="ts">
    export let ariaLabelledBy
    export let handleClose
    export let ariaDescribedBy = undefined
    export let classNames
    export let size = 'small'

    let dialogClassNames = 'dialog fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'

    if (classNames) {
        dialogClassNames += ` ${classNames}`
    }

    /**
     * Size variant
     */
    if (size == 'small') {
        dialogClassNames += ' dialog__small'
    }

    if (size == 'large') {
        dialogClassNames += ' dialog__large'
    }

    const handleKeydown = e => {
        if (e.key == 'Escape') {
            handleClose(e)
            return
        }
    }
</script>

<style>
    .dialog__small {
        height: 60vh;
        width: 40vw;
    }

    .dialog__large {
        height: 90vh;
        width: 90vw;
    }
</style>

<svelte:window on:keydown={handleKeydown} />

<div class="bg-black bg-opacity-25 fixed top-0 left-0 h-full w-full"
     on:click|preventDefault={handleClose}>
</div>

<div role="alertdialog"
     aria-modal="true"
     aria-labelledby={ariaLabelledBy}
     aria-describedby={ariaDescribedBy}
     class="{dialogClassNames}"
>
    <slot></slot>
</div>
