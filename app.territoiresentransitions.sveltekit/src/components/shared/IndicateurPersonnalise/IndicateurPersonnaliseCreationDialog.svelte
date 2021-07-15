<script lang="ts">
    import IndicateurForm from './IndicateurPersonnaliseForm.svelte'
    import {createEventDispatcher, onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import {v4 as uuid} from 'uuid'
    import {IndicateurPersonnaliseInterface} from "../../../generated/models/indicateur_personnaliseise";
    import Dialog from "../Dialog.svelte";

    let data: IndicateurPersonnaliseInterface
    const dispatch = createEventDispatcher()
    const initialize = () => {
        data = {
            epci_id: '',
            uid: uuid(),
            custom_id: '',
            nom: '',
            description: '',
            unite: '',
        }
    }

    const handleSave = async (event: any) => {
        dispatch('save', event.detail)
        initialize()
        close(event)
    }

    onMount(async () => {
        data.epci_id = getCurrentEpciId()
    });

    initialize()

    const close = (event: MouseEvent) => dispatch('AddDialogClose', event)

</script>


<Dialog ariaLabelledBy="dialog-title"
        handleClose={close}
        size="small">

    <span slot="modal-title">Nouvel indicateur</span>

    <IndicateurForm bind:data={data} on:save={handleSave}/>
</Dialog>