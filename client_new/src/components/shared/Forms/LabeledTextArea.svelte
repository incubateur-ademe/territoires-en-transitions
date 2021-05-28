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

    // An optional prop passed to textarea.
    export let maxlength: number = undefined

    // The on blur function passed to textarea. Used for implicit saving.
    export let onBlur: (event: FocusEvent) => void = (event: FocusEvent): void => {}
</script>

<label class="flex flex-col w-full">{label}<slot></slot>
    <textarea bind:value={value}
              on:blur={onBlur}
              class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
              maxlength={maxlength}></textarea>
</label>