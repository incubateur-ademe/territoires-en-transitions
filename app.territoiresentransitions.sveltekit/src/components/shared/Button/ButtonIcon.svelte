<script lang="ts">
    import ButtonBase from './ButtonBase.svelte'

    export let classNames
    export let colorVariant = 'nettle'

    const buttonClassNames = 'h-10 w-10 p-0'
</script>

<ButtonBase colorVariant="{colorVariant}"
            classNames="
            {buttonClassNames}
            {classNames ? ` ${classNames}` : ''}"
            on:click
>
    <slot></slot>
</ButtonBase>
