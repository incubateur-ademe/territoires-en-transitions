<script lang="typescript">
    enum colorVariants {
        nettle,
        bramble,
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
            ' border-green-700 border-2 hover:bg-green-100 active:bg-green-600'
    }

    if (colorVariant == 'nettle') {
        buttonClassNames +=
            ' border-green-700 border-2 hover:bg-green-100 active:bg-green-600'
    }

    if (colorVariant == 'bramble') {
        buttonClassNames +=
            ' border-gray-800 border hover:bg-green-100 active:bg-green-600'
    }
</script>

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
