<script lang="ts">

    export let ariaLabelledBy
    export let ariaDescribedBy
    export let handleClose

    const handleKeydown = e => {
        if (e.key == 'Escape') {
            handleClose()
            return
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="bg-black bg-opacity-25 fixed top-0 left-0 h-full w-full" on:click={handleClose}></div>

<div role="alertdialog"
     aria-modal="true"
     aria-labelledby={ariaLabelledBy}
     aria-describedby={ariaDescribedBy}
     class="overflow-auto absolute top-1/2 left-1/2 h-screen-90 w-screen-90 transform -translate-x-1/2 -translate-y-1/2"
>
    <slot></slot>
</div>
