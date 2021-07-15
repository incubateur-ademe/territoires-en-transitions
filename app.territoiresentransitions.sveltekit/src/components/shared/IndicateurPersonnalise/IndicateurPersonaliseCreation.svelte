<script lang="ts">
    import IndicateurForm from './IndicateurPersonnaliseForm.svelte'
    import {createEventDispatcher, onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import {v4 as uuid} from 'uuid'
    import {IndicateurPersonnaliseInterface} from "../../../generated/models/indicateur_personnaliseise";

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
    }

    onMount(async () => {
        data.epci_id = getCurrentEpciId()
    });

    initialize()
</script>

<div class="bg-gray-200 p-4 mt-2 mb-5">
    <h5 class="text-lg">Nouvel indicateur</h5>
    <IndicateurForm bind:data={data} on:save={handleSave}/>
</div>
