<script lang="ts">
    /**
     * A text area with a label on top
     *
     * One can use the label prop to display an _unstyled_ text on top of the textarea.
     * In order to style the label text, a child element should be passed instead.
     */
    import {v4 as uuid} from 'uuid'

    // The textarea value, must be set.
    export let value: string

    // An optional unstyled label text.
    export let label: string = ''

    // An optional prop passed to textarea.
    export let maxlength: number = undefined

    // An optional id for label and input link
    export let id: string = uuid()

    // The on blur function passed to textarea. Used for implicit saving.
    export let onBlur: (event: FocusEvent) => void = (_): void => {
    }
</script>

<style>
    fieldset {
        margin-bottom: 3.25rem;
        padding: 0;
        border: none;
    }

    textarea {
        margin-top: .5rem;
    }
</style>

<fieldset>
    <label for="{id}">{label}
        <slot></slot>
    </label>

    <textarea bind:value={value}
              on:blur={onBlur}
              class="fr-input"
              maxlength={maxlength}
    id="{id}"></textarea>
</fieldset>
