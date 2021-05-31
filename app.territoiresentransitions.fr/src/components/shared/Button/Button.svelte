<script lang="typescript">
    import ButtonBase from './ButtonBase.svelte'

    enum sizes {
        normal,
        small,
    }

    export let label = ''
    export let full = false
    export let classNames = ''
    export let colorVariant = 'nettle'
    export let size = 'normal'
    export let asLink = false
    export let href = ''

    let buttonClassNames = ''

    /**
     * Size variants
     */
    if (size == 'normal') {
        buttonClassNames += ' px-6 py-3'
    }

    if (size == 'small') {
        buttonClassNames += ' text-base px-3 py-2'
    }

    if (full) {
        buttonClassNames += ' full'
    }
</script>

<ButtonBase asLink={asLink}
            href={href}
            colorVariant={colorVariant}
            on:click
            classNames="
            {buttonClassNames}
            {classNames ? ` ${classNames}` : ''}"
>
    {label}
    <slot></slot>
</ButtonBase>