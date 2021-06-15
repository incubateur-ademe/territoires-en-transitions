<script lang="ts">
    /**
     * Display the title of an action.
     */
    import {ActionReferentiel} from "../../../../../generated/models/action_referentiel";

    export let action: ActionReferentiel

    $: depth = action.id.split('.').length

</script>

<h3 on:click|preventDefault>
    <span class="mr-4">{action.id_nomenclature} </span>
    <span class="mr-4">{action.nom}</span>
</h3>
