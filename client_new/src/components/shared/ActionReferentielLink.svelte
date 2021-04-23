<script lang="ts">
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import AddFiche from "../icons/AddFiche.svelte";
    import Angle from "./Angle.svelte";

    export let action: ActionReferentiel

    let epciId = ''
    onMount(async () => {
        epciId = getCurrentEpciId()
    })
</script>

<div class="bg-white shadow-lg p-5 my-5">
    <div class="flex flex-row">
        <a href="fiches/creation/?epci_id={epciId}&action_id={action.id}">
            <AddFiche/>
        </a>
        <a class="flex flex-row flex-grow items-start"
           href="actions_referentiels/{action.id}/"
           rel="prefetch">

            <h3 class="flex flex-grow">
                <span class="mr-1">{action.id.startsWith('citergie') ? '🌍' : '♻'} </span>
                <span class="mr-4">{action.id_nomenclature} </span>
                <span class="mr-4">{action.nom}</span>
            </h3>
            <Angle />
        </a>
    </div>
</div>
