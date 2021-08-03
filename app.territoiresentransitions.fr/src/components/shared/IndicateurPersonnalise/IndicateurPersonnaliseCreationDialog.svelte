<script lang="ts">
    import IndicateurForm from './IndicateurPersonnaliseForm.svelte'
    import {createEventDispatcher, onMount} from "svelte";
    import {v4 as uuid} from 'uuid'
    import Dialog from "../Dialog.svelte";

    let indicateurUid: string
    const dispatch = createEventDispatcher()
    const resetUid = () => {
        indicateurUid = uuid()
    }

    const handleSave = async (event: any) => {
        dispatch('save', event.detail)
        resetUid()
        close(event)
    }
    resetUid()

    const close = (event: MouseEvent) => dispatch('AddDialogClose', event)

</script>


<Dialog ariaLabelledBy="dialog-title"
        handleClose={close}
        size="small">

    <span slot="modal-title">Nouvel indicateur</span>

    <IndicateurForm bind:indicateurUid={indicateurUid} on:save={handleSave}/>
</Dialog>