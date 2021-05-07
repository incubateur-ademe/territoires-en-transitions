<script lang="ts">
    import {createEventDispatcher, onMount} from "svelte";
    import Button from "../../components/shared/Button/Button.svelte";
    import {IndicateurPersonnaliseInterface} from "../../../generated/models/indicateur_personnalise";
    import {indicateurPersonnaliseStore, LocalStore} from "../../api/localStore";
    import {IndicateurPersonnaliseStorable} from "../../storables/IndicateurPersonnaliseStorable";
    import LabeledTextInput from "../../components/shared/Forms/LabeledTextInput.svelte";
    import LabeledTextArea from "../../components/shared/Forms/LabeledTextArea.svelte";

    export let data: IndicateurPersonnaliseInterface
    let indicateurStore: LocalStore<IndicateurPersonnaliseStorable>
    const dispatch = createEventDispatcher()

    onMount(async () => {
        // todo use API
        indicateurStore = indicateurPersonnaliseStore
    })

    const handleSave = async () => {
        console.log('form data', data)
        if (!data.nom) return;
        const indicateur = new IndicateurPersonnaliseStorable(data)
        const saved = await indicateurStore.store(indicateur)
        dispatch('save', {'indicateur': saved})
    }
</script>

<section class="flex flex-col md:w-3/4">
    <LabeledTextInput bind:value={data.custom_id}
                      label="Identifiant"/>

    <LabeledTextInput bind:value={data.nom}
                      label="Nom"/>

    <LabeledTextArea bind:value={data.description}
                     label="Description"/>

    <LabeledTextInput bind:value={data.unite}
                      label="Unite"/>

    <Button classNames="md:w-1/3 self-end bg-white"
            full
            label="Valider"
            on:click={handleSave}/>
</section>