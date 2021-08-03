<script lang="ts">
    /**
     * An text input with a label on top
     *
     * One can use the label prop to display an _unstyled_ text on top of the textarea.
     * In order to style the label text, a child element should be passed instead.
     */
    import type {Validator} from "$api/validator";
    import {alwaysValid} from "$api/validator";
    import {onMount} from "svelte";

    // The text input value, must be set.
    export let value: string | number

    // An optional unstyled label text.
    export let label: string = ''

    // An optional unstyled hint text.
    export let hint: string = ''

    // An optional prop passed to textarea.
    export let maxlength: number = undefined

    // An optional validator
    export let validator: Validator = alwaysValid

    // id for label and input link
    export let id: string = '' // TODO : dangerous to set default id to ''  => Leading to warnings `<LabeledTextInput> was created without expected prop 'id'` 

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
    }
</style>

<fieldset>
    <label class="fr-label" for="{id}">{label}
        <slot></slot>
    </label>

    {#if !errorMessage && hint}<div class="hint">{hint}</div>{/if}

    {#if errorMessage}
        <div class="hint">
            {errorMessage}
        </div>
    {/if}

    <input bind:value={value}
           maxlength={maxlength}
           on:keyup={() => errorMessage=validator(value)}
           class="fr-input"
           id="{id}"
    >
</fieldset>
