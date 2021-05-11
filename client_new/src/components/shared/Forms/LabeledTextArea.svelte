<script lang="ts">
    import {createEventDispatcher} from "svelte";

    /**
     * An text input with a label on top
     *
     * One can use the label prop to display an _unstyled_ text on top of the textarea.
     * In order to style the label text, a child element should be passed instead.
     *
     * Use the save event to handle the user save intent.
     */
    const dispatch = createEventDispatcher()

    // The textarea value, must be set.
    export let value: string

    // An optional unstyled label text.
    export let label: string = ''

    // An optional prop passed to textarea.
    export let maxlength: number = undefined


    // An on save
    let _timer;

    // Debounce on key up.
    const onKeyup = () => {
        clearTimeout(_timer);
        _timer = setTimeout(() => {
            dispatch('save')
        }, 500);
    }

    // Save almost immediately on blur.
    const onBlur = () => {
        clearTimeout(_timer);
        _timer = setTimeout(() => {
            dispatch('save')
        }, 16);
    }
</script>

<label class="flex flex-col w-full">{label}
    <slot></slot>
    <textarea bind:value={value}
              class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
              maxlength={maxlength}
              on:blur={onBlur}
              on:keyup={onKeyup}></textarea>
</label>