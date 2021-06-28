<script lang="ts">
    /**
     * An text input with a label on top
     *
     * One can use the label prop to display an _unstyled_ text on top of the textarea.
     * In order to style the label text, a child element should be passed instead.
     */
    import {alwaysValid, Validator} from "../../../api/validator";
    import {onMount} from "svelte";

    // The text input value, must be set.
    export let value: string

    // An optional unstyled label text.
    export let label: string = ''

    // An optional unstyled hint text.
    export let hint: string = ''

    // An optional prop passed to textarea.
    export let maxlength: number = undefined

    // An optional validator
    export let validator: Validator = alwaysValid

    // id for label and input link
    export let id: string = ''

    let errorMessage: string | null = null

    onMount(() => {
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
    <!-- Besoin de mettre le for sur le label et l'id sur l'input-->
    <label class="fr-label" for="{id}">{label}
        <slot></slot>
    </label>
    {#if hint}<div class="hint">{hint}</div>{/if}
    <input bind:value={value}
           maxlength={maxlength}
           on:keyup={() => errorMessage=validator(value)}
           class="fr-input"
           id="{id}"
    >
    {#if errorMessage}
        <div class:text-blush-700="{value}">
            {errorMessage}
        </div>
    {/if}
</fieldset>
