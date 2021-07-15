<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import Button from "../Button/Button.svelte";
    import {IndicateurPersonnaliseInterface} from "../../../generated/models/indicateur_personnaliseise";
    import {IndicateurPersonnaliseStorable} from "../../../storables/IndicateurPersonnaliseStorable";
    import LabeledTextInput from "../Forms/LabeledTextInput.svelte";
    import LabeledTextArea from "../Forms/LabeledTextArea.svelte";

    export let data: IndicateurPersonnaliseInterface
    const dispatch = createEventDispatcher()

    const handleSave = async () => {
        if (!data.nom) return

        const hybridStores = await import ("../../../api/hybridStores")
        const indicateur = new IndicateurPersonnaliseStorable(data)
        const saved = await hybridStores.indicateurPersonnaliseStore.store(indicateur)
        dispatch('save', {'indicateur': saved})
    }
</script>

<style>
    section :global(fieldset) {
        max-width: 100%;
        margin-bottom: 3rem;
        padding: 0;
        border: none;
    }
</style>

<section>
    <LabeledTextInput bind:value={data.nom}
                      label="Titre"/>

    <LabeledTextArea bind:value={data.description}
                     label="Description"/>

    <LabeledTextInput bind:value={data.unite}
                      label="Unité"/>

    <button class="fr-btn fr-btn--secondary"
            on:click|preventDefault={handleSave}>
        Enregister
    </button>
</section>