<script lang="ts">
    /**
     * The input for an indicateur yearly value.
     * Retrieve and store values.
     */
    import {onMount} from "svelte";

    export let year: number

    export let retrieveValue: () => Promise<string>
    export let saveValue: (value: string) => Promise<void>

    let value = ""

    onMount(async () => {
        value = await retrieveValue()
    })

    /**
     * Save value for a single yearly input on blur.
     */
    const onBlur = (): void => {
        saveValue(value)
    }

    /**
     * Call blur on enter.
     */
    const onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Enter') {
            const input = event.target as HTMLInputElement
            input.blur()
        }
    }
</script>

<label>
    { year }
    <input class="fr-input"
           data-indicator-year="{ year }"
           bind:value={value}
           on:keydown={onKeyDown}
           on:blur={onBlur}
           type="text"
    />
</label>