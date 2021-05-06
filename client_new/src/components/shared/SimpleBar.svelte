<script lang="ts">
    export let id: string
    export let shadowSize: string = ''
</script>

<div class="flex flex-col mb-5 relative" id="{id}">
    <div class="flex flex-row items-center px-4 pt-5 pb-4 bg-white
                transform translate-y-0.5 hover:translate-y-0
                shadow{shadowSize ? `-${shadowSize}` : '' }
                hover:shadow{shadowSize ? `-${shadowSize}` : '' }">

        <slot name="aside"></slot>

        <div class="flex items-center flex-grow
                    { $$slots.secondary ? ' max-w-lg' : '' }">
            <slot></slot>
        </div>

        {#if $$slots.secondary }
            <div class="ml-4">
                <slot name="secondary"></slot>
            </div>
        {/if}
    </div>
</div>
