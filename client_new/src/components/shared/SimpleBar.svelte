<script lang="ts">
    export let handleClick
    export let withArrow = false
    export let withShadow = false
    export let classNames

    let barClassNames = 'block flex p-4 bg-white border border-gray-200 shadow-lg text-lg'

    if (classNames) {
        barClassNames += ` ${classNames}`
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

<div class="{barClassNames}"
     class:arrow-end="{withArrow}"
     class:shadow-lg="{withShadow}"
>
    <div class="mr-4 self-center">
        <slot name="aside"></slot>
    </div>

    <h4 class="underline:hover self-center mr-4">
        {#if handleClick }
            <a href="#" on:click|preventDefault={handleClick}>
                <slot></slot>
            </a>
        {:else}
            <slot></slot>
        {/if}
    </h4>
</div>