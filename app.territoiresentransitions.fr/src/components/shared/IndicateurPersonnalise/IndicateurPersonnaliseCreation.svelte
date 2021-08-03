<script lang="ts">
    import IndicateurForm from './IndicateurPersonnaliseForm.svelte'
    import {createEventDispatcher} from "svelte";
    import {v4 as uuid} from 'uuid'

    let indicateurUid: string
    const dispatch = createEventDispatcher()
    const resetUid = () => {
        indicateurUid = uuid()
    }

    const handleSave = async (event: any) => {
        dispatch('save', event.detail)
        resetUid()
    }
    resetUid()
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
    <IndicateurForm bind:indicateurUid={indicateurUid} on:save={handleSave}/>
</div>
