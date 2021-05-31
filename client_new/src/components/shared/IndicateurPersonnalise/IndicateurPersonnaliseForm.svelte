<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import Button from "../Button/Button.svelte";
    import {IndicateurPersonnaliseInterface} from "../../../../../generated/models/indicateur_personnalise";
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

<section class="flex flex-col md:w-3/4">
    <LabeledTextInput bind:value={data.nom}
                      label="Titre"/>

    <LabeledTextArea bind:value={data.description}
                     label="Description"/>

    <LabeledTextInput bind:value={data.unite}
                      label="Unité"/>

    <Button classNames="md:w-1/3 self-end bg-white"
            full
            label="Valider"
            on:click={handleSave}/>
</section>