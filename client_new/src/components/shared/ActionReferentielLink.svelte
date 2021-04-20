<script lang="ts">
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import AddFiche from "../icons/AddFiche.svelte";

    export let action: ActionReferentiel

    let epciId = ''
    onMount(async () => {
        epciId = getCurrentEpciId()
    })
</script>

<section class="bg-white shadow-lg p-5 my-5">
    <div class="block flex flex-row">
        <a href="fiches/creation/?epci_id={epciId}&action_id={action.id}">
            <AddFiche/>
        </a>
        <a class="block flex flex-row "
           href="actions_referentiels/{action.id}/"
           rel="prefetch">

            <h3 class="pr-28 flex-grow">({action.id}) {action.nom}</h3>
            <div class="chevron">
                >
            </div>
        </a>
    </div>
</section>
