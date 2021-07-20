<script lang="ts">
    /**
     * An checkbox with a label on its right
     *
     * One can use the label prop to display an _unstyled_ text on top of the textarea.
     * In order to style the label text, a child element should be passed instead.
     */
    import type { Validator} from "$api/validator";
    import {alwaysValid} from "$api/validator";
    import {onMount} from "svelte";
    import {v4 as uuid} from 'uuid'

    // The checkbox input value, must be set.
    export let value: boolean

    // An optional unstyled label text.
    export let label: string = ''

    // An optional unstyled hint text.
    export let hint: string = ''

    // An optional validator
    export let validator: Validator = alwaysValid

    // An optional id for label and input link
    export let id: string = uuid()

    // Show the validator message on mount.
    export let validateOnMount: boolean = true

    let errorMessage: string | null = null

    onMount(() => {
        if (validateOnMount)
            errorMessage = validator(value)
    })
</script>

<style>
    fieldset {
        max-width: 50%;
    }

    .hint {
        margin-top: .25rem;
        font-size: 0.75rem;
        color: var(--g600);
    }

    input {
        margin-top: .5rem;
        margin-right: .5rem;
    }

    .row {
        display: flex;
        flex-direction: row;
    }
</style>

<fieldset>
    <div class="row">
        <input bind:checked={value}
               class="form-checkbox"
               id="{id}"
               on:change={() => errorMessage=validator(value)}
               type=checkbox>

        <label class="fr-label" for="{id}">{label}
            <slot></slot>
        </label>
    </div>

    {#if !errorMessage && hint}
        <div class="hint">{hint}</div>
    {/if}

    {#if errorMessage}
        <div class="hint">
            {errorMessage}
        </div>
    {/if}
</fieldset>
