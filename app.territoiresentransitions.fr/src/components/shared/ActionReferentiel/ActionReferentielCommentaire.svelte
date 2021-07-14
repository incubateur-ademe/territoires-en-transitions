<script lang="ts">
    import {onMount} from "svelte";
    import {ActionReferentiel} from "../../../../../generated/models/action_referentiel";
    import ExpandPanel from "../../../../../components/ExpandPanel.svelte";
    import {ActionMetaStorable} from "../../../storables/ActionMetaStorable";
    import {joinValidators, validate} from "../../../api/validator";
    import {maximumLengthValidatorBuilder} from "../../../api/validators";
    import LabeledTextArea from "../Forms/LabeledTextArea.svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";

    export let action: ActionReferentiel
    let meta: ActionMetaStorable
    let commentaire: string = ''

    const validator = joinValidators([maximumLengthValidatorBuilder(1000)])

    const handleSave = async () => {
        let valid = validate(commentaire, validator)
        if (!valid) return window.alert(`Le commentaire n'est pas valide : ${validator(commentaire)}`);

        const stores = await import("../../../api/hybridStores")
        if (!meta)
            meta = new ActionMetaStorable({action_id: action.id, epci_id: getCurrentEpciId(), meta: {}})

        meta.meta['commentaire'] = commentaire
        await stores.actionMetaStore.store(meta)
    }

    onMount(async () => {
        const stores = await import("../../../api/hybridStores")
        meta = await stores.actionMetaStore.retrieveById(ActionMetaStorable.buildId(getCurrentEpciId(), action.id))
        if (meta)
            commentaire = meta.meta['commentaire'] ?? ''
    })
</script>

<style>
    .commentBlock {
        width: 50%;
    }

    .commentBlock :global(.fr-btn) {
        margin-top: 1rem;
    }
</style>

<div class="commentBlock">
    <ExpandPanel>
        <h2 slot="title">Commentaire</h2>
        <div slot="content">
            <LabeledTextArea bind:value={commentaire}>
            </LabeledTextArea>
            <button class="fr-btn" on:click={handleSave}>Enregistrer</button>
        </div>
    </ExpandPanel>
</div>