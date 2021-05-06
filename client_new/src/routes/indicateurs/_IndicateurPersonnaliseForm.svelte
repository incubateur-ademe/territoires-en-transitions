<script lang="ts">

    import {createEventDispatcher, onMount} from "svelte";
    import Button from "../../components/shared/Button/Button.svelte";
    import {IndicateurPersonnaliseInterface} from "../../../generated/models/indicateur_personnalise";
    import {indicateurPersonnaliseStore, LocalStore} from "../../api/localStore";
    import {IndicateurPersonnaliseStorable} from "../../storables/IndicateurPersonnalise";

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

<section class="flex flex-col">
    <label class="text-sm" for="indicateur_form_nom">Nom</label>
    <input bind:value={data.nom}
           class="border border-gray-300 p-2 my-2 focus:outline-none focus:ring-2 ring-green-100"
           id="indicateur_form_nom"
           maxlength="100">
    <div class="p-2"></div>
    <Button classNames="md:w-1/3 self-end bg-white"
            full
            label="Valider"
            on:click={handleSave}/>
</section>