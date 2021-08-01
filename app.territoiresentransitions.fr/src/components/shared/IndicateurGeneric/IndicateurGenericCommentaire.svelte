<script lang="ts">
    /**
     * The text area for an indicateur commentaire
     * Retrieve and store values.
     */
    import {onMount} from "svelte";
    import LabeledTextArea from "../Forms/LabeledTextArea.svelte";

    // Mandatory indicateur prop to attach the commentaire.
    export let retrieveCommentaire: () => Promise<string>
    export let saveCommentaire: (value: string) => Promise<void>
    
        let commentaireValue = ""

    onMount(async () => {
        commentaireValue = await retrieveCommentaire()
    })

    const onSave = (_): void => {
        saveCommentaire(commentaireValue)
    }
</script>

<style>
    .fr-btn {
        margin-top: 1rem;
    }
</style>

<div>
    <LabeledTextArea bind:value={commentaireValue}>
        <div>Votre commentaire</div>
    </LabeledTextArea>

    <button class="fr-btn fr-btn--secondary" on:click={onSave}>Enregistrer</button>
</div>
