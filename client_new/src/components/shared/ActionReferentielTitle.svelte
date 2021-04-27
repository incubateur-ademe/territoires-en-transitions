<script lang="ts">
    /**
     * Display the title of an action with an optional `emoji` prop.
     */
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";

    export let action: ActionReferentiel

    // Show referentiel emoji
    export let emoji: boolean = false


    $: depth = action.id.split('.').length

</script>

<h3 class="flex flex-grow">
    {#if emoji}
        <span class="mr-1">{action.id.startsWith('citergie') ? '🌍' : '♻'} </span>
    {/if}
    <span class="mr-4">{action.id_nomenclature} </span>
    <span class="mr-4">{action.nom}</span>
</h3>
