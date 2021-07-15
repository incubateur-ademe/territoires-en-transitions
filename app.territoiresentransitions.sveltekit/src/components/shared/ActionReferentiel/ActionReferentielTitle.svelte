<script lang="ts">
    /**
     * Display the title of an action.
     */
    import {ActionReferentiel} from "../../../generated/models/action_referentieliel";

    export let action: ActionReferentiel

    $: depth = action.id.split('.').length

</script>

<style>
    h3 {
        font-size: 1.25rem;
        line-height: 1.33;
    }
</style>

<h3 on:click|preventDefault>
    <span>{action.id_nomenclature} - </span>
    {action.nom}
</h3>
