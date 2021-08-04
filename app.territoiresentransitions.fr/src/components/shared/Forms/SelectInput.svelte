<script lang="ts">
    /**
     * A select input with a label on top
     *
     * One can use the label prop to display an _unstyled_ text on top of the select.
     * In order to style the label text, a child element should be passed instead.
     */
    import {v4 as uuid} from "uuid";

    // The textarea value, must be set.
    export let value: string

    // An optional unstyled label text.
    export let label: string = ''

    // An optional id for label and input link
    export let id: string = uuid()

    // The on blur callback passed to textarea. Used for implicit saving.
    export let onChange: (event: Event) => void = (_): void => {
    }
</script>

<style>
    .fr-select {
        width: 100%;
    }
</style>

<div>
    <label class="fr-label" for="{id}">{label}</label>
    <select bind:value={value} class="fr-select" id="{id}"
            on:change={onChange}>
        <slot></slot>
    </select>
</div>