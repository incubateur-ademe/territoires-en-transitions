<script lang="typescript">
    enum colorVariants {
        juniper,
        whitelily,
    }

    export let classNames = ''
    export let colorVariant = 'juniper'
    export let size = 'medium'
    export let disabled = false
    export let asLink = false
    export let href = ''

    let buttonClassNames = 'fr-btn'

    /**
     * Color variants
     */

    if (colorVariant == 'whitelily') {
        buttonClassNames +=
            ' fr-btn--secondary'
    }

    if (colorVariant == 'blueberry') {
        buttonClassNames +=
            ' button blueberry'
    }

    /**
     * Size variants
     */

    if (size == 'sm') {
        buttonClassNames += ' fr-btn--sm'
    }
</script>

{#if asLink}
    <a
            href="{ href }"
            disabled={disabled}
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
            disabled={disabled}
            class="
  	{buttonClassNames}
  	{classNames ? ` ${classNames}` : ''}"
    >
        <slot></slot>
    </button>

{/if}
