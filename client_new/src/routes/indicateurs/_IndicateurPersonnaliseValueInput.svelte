<script lang="ts">
    /**
     * The input for an indicateur yearly value.
     * Retrieve and store values.
     */
    import {IndicateurReferentiel} from "../../../generated/models/indicateur_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import {indicateurPersonnaliseValueStore, LocalStore} from "../../api/localStore";
    import {IndicateurPersonnaliseValueStorable} from "../../storables/IndicateurPersonnaliseValueStorable";

    export let indicateur: IndicateurReferentiel
    export let year: number

    let indicateurValueStore: LocalStore<IndicateurPersonnaliseValueStorable>
    let value = ''
    let epciId = ''

    onMount(async () => {
        indicateurValueStore = indicateurPersonnaliseValueStore;
        epciId = getCurrentEpciId()

        const indicateurValue: IndicateurPersonnaliseValueStorable = indicateurValueStore.retrieveById(
            `${epciId}/${indicateur.id}/${year}`
        )
        value = indicateurValue.value
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
           class="border border-gray-400 rounded px-2 py-1 shadow-sm
                  outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full"
           data-indicator-id="{ indicateur.id }"
           data-indicator-year="{ year }"
           on:blur={onBlur}
           on:keydown={onKeyDown}
           type="text"/>
</label>