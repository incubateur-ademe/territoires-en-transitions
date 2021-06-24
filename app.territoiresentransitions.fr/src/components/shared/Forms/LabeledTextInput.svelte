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

    // Show the validator message on mount.
    export let validateOnMount: boolean = true

    let errorMessage: string | null = null

    onMount(() => {
        if (validateOnMount)
            errorMessage = validator(value)
    })
</script>

<div class="flex flex-col w-full">
    <label class="flex flex-col w-full">{label}
        <slot></slot>
        <input bind:value={value}
               class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
               maxlength={maxlength}
               on:keyup={() => errorMessage=validator(value)}>
    </label>
    <div class="mb-2">{hint}</div>
    {#if errorMessage}
        <div class="mb-2"
             class:text-blush-700="{value}">
            {errorMessage}
        </div>
    {/if}
</div>
