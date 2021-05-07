<script lang="ts">
    /**
     * An text input with a label on top
     */
    export let label: string
    export let value: string
    export let maxlength: number
</script>

<label class="flex flex-col w-full">{label}
    <input bind:value={value}
           class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
           maxlength={maxlength}>
</label>