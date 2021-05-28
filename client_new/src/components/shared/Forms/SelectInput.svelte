<script lang="ts">
    /**
     * An text input with a label on top
     *
     * One can use the label prop to display an _unstyled_ text on top of the textarea.
     * In order to style the label text, a child element should be passed instead.
     */

    // The textarea value, must be set.
    export let value: string

    // An optional unstyled label text.
    export let label: string = ''

    // The on blur function passed to textarea. Used for implicit saving.
    export let onChange: (event: Event) => void = (event: Event): void => {}
</script>

<label class="flex flex-col w-full">{label}<slot name="label"></slot>
    <select bind:value={value}
            class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
            on:change={onChange}>
        <slot></slot>
    </select>
</label>