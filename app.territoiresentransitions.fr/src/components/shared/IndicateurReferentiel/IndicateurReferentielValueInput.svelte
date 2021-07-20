<script lang="ts">
    /**
     * The input for an indicateur yearly value.
     * Retrieve and store values.
     */
    import type {IndicateurReferentiel} from "$generated/models/indicateur_referentiel";

    import {IndicateurValueStorable} from '$storables/IndicateurValueStorable'
    import {onMount} from "svelte";
    import type {HybridStore} from "$api/hybridStore";
    import {getCurrentEpciId} from "$api/currentEpci";

    export let indicateur: IndicateurReferentiel
    export let year: number
    let indicateurValueStore: HybridStore<IndicateurValueStorable>
    let value = ''
    let epciId =''

    onMount(async () => {
        const hybridStores = await import ("$api/hybridStores");
        indicateurValueStore = hybridStores.indicateurValueStore;
        epciId = getCurrentEpciId()

        const indicateurValues = await indicateurValueStore.retrieveAtPath(
            `${epciId}/${indicateur.id}/${year}`
        )
        if (indicateurValues.length) { // we should have one value per year, although the API returns a list.
            value = indicateurValues[0].value
        }
    })

    /**
     * Save value for a single yearly input on blur.
     */
    const onBlur = (event: FocusEvent): void => {
        const indicateurValue = new IndicateurValueStorable({
            epci_id: epciId,
            indicateur_id: indicateur.id,
            year: year,
            value: value
        })
        indicateurValueStore.store(indicateurValue)
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
           data-indicator-id="{ indicateur.id }"
           data-indicator-year="{ year }"
           bind:value={value}
           on:keydown={onKeyDown}
           on:blur={onBlur}
           type="text"
    />
</label>