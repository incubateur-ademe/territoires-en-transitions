<script lang="typescript">
    enum colorVariants {
        nettle,
        bramble,
        pine,
    }

    export let classNames = ''
    export let colorVariant = 'nettle'
    export let asLink = false
    export let href = ''

    let buttonClassNames = ''

    /**
     * Color variants
     */
    if (colorVariant == 'nettle') {
        buttonClassNames +=
            ' border-seagreen-700 border-2 hover:bg-seagreen-100 active:bg-seagreen-400'
    }

    if (colorVariant == 'pine') {
        buttonClassNames +=
            ' border-green-700 bg-green-600 text-white border-2 hover:bg-green-700 active:bg-green-600'
    }

    if (colorVariant == 'bramble') {
        buttonClassNames +=
            ' border-gray-800 border hover:bg-green-100 active:bg-green-600'
    }

    if (colorVariant == 'ash') {
        buttonClassNames +=
            ' border-gray-600 border bg-gray-200 text-gray-600'
    }

    if (colorVariant == 'juniper') {
        buttonClassNames +=
            ' button juniper'
    }

    if (colorVariant == 'blueberry') {
        buttonClassNames +=
            ' button blueberry'
    }
</script>

<style>
    button {
        border: 2px solid;
    }

    :global(.juniper) {
        color: var(--w);
        background-color: var(--bf500);
        border-color: var(--bf500);
    }

    :global(.blueberry) {
        color: var(--bf500);
        border-color: var(--bf500);
    }
</style>

{#if asLink}
    <a
            href="{ href }"
            class="
  	{buttonClassNames}
  	{classNames ? ` ${classNames}` : ''}"
    >
        <slot></slot>
    </a>
{:else }
    <button
            type="button"
            on:click|preventDefault
            class="
  	{buttonClassNames}
  	{classNames ? ` ${classNames}` : ''}"
    >
        <slot></slot>
    </button>

{/if}
