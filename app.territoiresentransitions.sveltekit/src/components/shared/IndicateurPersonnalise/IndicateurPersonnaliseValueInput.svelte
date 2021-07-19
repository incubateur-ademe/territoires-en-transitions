<script lang="ts">
    /**
     * The input for an indicateur yearly value.
     * Retrieve and store values.
     */
    import type {IndicateurReferentiel} from "$generated/models/indicateur_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "$api/currentEpci";
    import {IndicateurPersonnaliseValueStorable} from "$storables/IndicateurPersonnaliseValueStorable";
    import type {HybridStore} from "$api/hybridStore";

    export let indicateur: IndicateurReferentiel
    export let year: number

    let indicateurValueStore: HybridStore<IndicateurPersonnaliseValueStorable>
    let value = ''
    let epciId = ''

    onMount(async () => {
        const hybridStores = await import ("$api/hybridStores");
        indicateurValueStore = hybridStores.indicateurPersonnaliseValueStore;
        epciId = getCurrentEpciId()

        try {
            const indicateurValue: IndicateurPersonnaliseValueStorable = await indicateurValueStore.retrieveById(
                `${epciId}/${indicateur.id}/${year}`
            )
            value = indicateurValue.value
        } catch (e) {
            // no value found it's ok
        }
    })

    /**
     * Save value for a single yearly input on blur.
     */
    const onBlur = (event: FocusEvent): void => {
        const indicateurValue = new IndicateurPersonnaliseValueStorable({
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

<label class="container">
    { year }
    <input bind:value={value}
           class="fr-input"
           data-indicator-id="{ indicateur.id }"
           data-indicator-year="{ year }"
           on:blur={onBlur}
           on:keydown={onKeyDown}
           type="text"/>
</label>