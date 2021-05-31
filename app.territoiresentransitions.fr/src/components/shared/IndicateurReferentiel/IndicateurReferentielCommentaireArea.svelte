<script lang="ts">
    /**
     * The text area for an indicateur commentaire
     * Retrieve and store values.
     */
    import {IndicateurReferentiel} from "../../../../../generated/models/indicateur_referentiel";
    import {onMount} from "svelte";
    import {HybridStore} from "../../../api/hybridStore";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import {IndicateurReferentielCommentaireStorable} from "../../../storables/IndicateurReferentielCommentaireStorable";
    import LabeledTextArea from "../Forms/LabeledTextArea.svelte";
    import Button from "../Button/Button.svelte";
    import {IndicateurReferentielCommentaireInterface} from "../../../../../generated/models/indicateur_referentiel_commentaire";

    // Mandatory indicateur prop to attach the commentaire.
    export let indicateur: IndicateurReferentiel

    let commentaireStore: HybridStore<IndicateurReferentielCommentaireStorable>

    // initial data.
    let data: IndicateurReferentielCommentaireInterface = {
        epci_id: '',
        indicateur_id: indicateur.id,
        value: ''
    }

    onMount(async () => {
        const hybridStores = await import ("../../../api/hybridStores")
        commentaireStore = hybridStores.indicateurReferentielCommentaireStore
        const epciId = getCurrentEpciId()
        data.epci_id = epciId

        const indicateurValues = await commentaireStore.retrieveAtPath(`${epciId}/${indicateur.id}`)
        if (indicateurValues.length) { // we should have one value, although the API returns a list.
            data = indicateurValues[0]
        }
    })

    const onSave = (_): void => {
        const indicateurValue = new IndicateurReferentielCommentaireStorable(data)
        commentaireStore.store(indicateurValue)
    }
</script>

<div class="flex flex-col">
    <LabeledTextArea bind:value={data.value}>
        <div class="text-xl">Commentaire</div>
    </LabeledTextArea>
    <div class="flex flex-row-reverse">
        <Button on:click={onSave}>Enregistrer</Button>
    </div>
</div>
