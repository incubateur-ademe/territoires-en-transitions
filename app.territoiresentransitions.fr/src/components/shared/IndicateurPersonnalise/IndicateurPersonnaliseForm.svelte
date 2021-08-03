<script lang="ts">
    import {createEventDispatcher, onMount} from "svelte";
    import type {IndicateurPersonnaliseInterface} from "$generated/models/indicateur_personnalise";
    import {IndicateurPersonnaliseStorable} from "$storables/IndicateurPersonnaliseStorable";
    import LabeledTextInput from "../Forms/LabeledTextInput.svelte";
    import LabeledTextArea from "../Forms/LabeledTextArea.svelte";
    import { getCurrentEpciId } from "$api/currentEpci";
    import { indicateurPersonnaliseStore } from "$api/hybridStores";

    export let indicateurUid: string
    let epciId = ""


    let data: IndicateurPersonnaliseInterface = {custom_id:  "", 
                description:  "", 
                nom:  "", 
                uid: indicateurUid,
                unite:  "", 
                epci_id: epciId,
                meta:  {commentaire: ""}, 
            }

    const dispatch = createEventDispatcher()

    const handleSave = async () => {
        if (!data.nom) return

        const indicateur = new IndicateurPersonnaliseStorable(data)
        const saved = await indicateurPersonnaliseStore.store(indicateur)
        dispatch('save', {'indicateur': saved}) // Qui écoute cet évènement ? 
    }

    onMount(async () => {  
        epciId = getCurrentEpciId()
        const stored = await indicateurPersonnaliseStore.retrieveAtPath(`${epciId}/${indicateurUid}`)
        if (stored.length){
            const indicateurPersonnaliseStorable = stored.length? stored[0]: undefined
            data = {custom_id: indicateurPersonnaliseStorable.custom_id, 
                description: indicateurPersonnaliseStorable.description, 
                nom: indicateurPersonnaliseStorable.nom, 
                uid: indicateurUid,
                unite: indicateurPersonnaliseStorable.unite, 
                epci_id: epciId,
                meta: indicateurPersonnaliseStorable.meta, 
            }
        }
    });
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
                      id="indicateur-personnalise-form-titre"
                      label="Titre"/>

    <LabeledTextArea bind:value={data.description}
                     id="indicateur-personnalise-form-description"
                     label="Description"/>

    <LabeledTextInput bind:value={data.unite}
                      id="indicateur-personnalise-form-unite"
                      label="Unité"/>
    <!-- Note: Property 'commentaire' does not exist on type 'object'. -->
    <!-- Suggestion #1 (quicker) : `any` instead of `object` -->
    <!-- Suggestion #2 (better - I think - ) : Define the field interface with type IndicateurMeta = {commentaire?: string} but save in DB meta as a JSON field -->
    <LabeledTextArea bind:value={data.meta.commentaire} 
                      id="indicateur-personnalise-form-commentaire"
                      label="Commentaire"/>
    <button class="fr-btn fr-btn--secondary"
            on:click|preventDefault={handleSave}>
        Enregister
    </button>
</section>