<script lang="ts">
    export let handleClick
    export let withArrow = false
    export let withShadow = false
    export let classNames

    let actionBarClassNames = 'block flex p-4 bg-white border border-gray-200 shadow-lg text-lg'

    if (classNames) {
        actionBarClassNames += ` ${classNames}`
    }

</script>

<style>
    .arrow-end::after {
        @apply text-5xl;
        @apply self-center;
        @apply block;
        transform: translateY(-.4rem);
        content: '›';
    }
</style>

<div class="{actionBarClassNames}"
     class:arrow-end="{withArrow}"
     class:shadow-lg="{withShadow}"
>
    <div class="mr-4 self-center">
        <slot name="aside"></slot>
    </div>

    <slot></slot>
</div>
