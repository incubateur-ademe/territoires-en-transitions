<script lang="ts">
    import IndicateurForm from './IndicateurPersonnaliseForm.svelte'
    import {createEventDispatcher, onMount} from "svelte";
    import {getCurrentEpciId} from "../../../api/currentEpci";
    import {v4 as uuid} from 'uuid'
    import {IndicateurPersonnaliseInterface} from "../../../../../generated/models/indicateur_personnalise";

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

<style>
    div {
        margin-top: 2rem;
        margin-left: 2rem;
        padding: 0 0 1rem 1rem;
        border-left: 4px solid var(--bf500);
    }
</style>

<div>
    <h3 class="text-lg">Nouvel indicateur</h3>
    <IndicateurForm bind:data={data} on:save={handleSave}/>
</div>
