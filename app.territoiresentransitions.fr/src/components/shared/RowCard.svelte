<script lang="ts">
    export let id: string = ''
    export let shadowSize: string = ''
</script>

<style>
    article {
        padding: .8rem;
        background-color: var(--beige);
    }

    article:not(:first-of-type) {
        margin-top: 1rem;
    }
</style>

<article id="{id}">
    <slot name="aside"></slot>

    <slot></slot>

    {#if $$slots.secondary }
        <div class="ml-4">
            <slot name="secondary"></slot>
        </div>
    {/if}
</article>