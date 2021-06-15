<script lang="ts">
    export let id: string = ''
    export let shadowSize: string = ''
</script>

<style>
    div {
        background-color: var(--beige);
    }
</style>

<div id="{id}">
    <slot name="aside"></slot>

    <div class="
                { $$slots.secondary ? ' max-w-lg' : '' }">
        <slot></slot>
    </div>

    {#if $$slots.secondary }
        <div class="ml-4">
            <slot name="secondary"></slot>
        </div>
    {/if}
</div>