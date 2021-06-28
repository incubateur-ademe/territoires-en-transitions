<script lang="ts">
    export let id: string = ''
    export let shadowSize: string = ''
    export let bordered: boolean = false
</script>

<style>
    article {
        padding: 1.5rem 1rem;
        background-color: var(--beige);
        border-left: 4px solid transparent;
    }
    
    article.bordered {
        border-left-color: var(--bf500);
    }

    article:not(:first-of-type) {
        margin-top: 1rem;
    }

    article :global(h3) {
        font-size: 1.25rem;
    }
</style>

<article id="{id}" class:bordered>
    <slot name="aside"></slot>

    <slot></slot>

    {#if $$slots.secondary }
        <div class="ml-4">
            <slot name="secondary"></slot>
        </div>
    {/if}
</article>