<script lang="ts">
    import ActionStatus from "./ActionStatus.svelte";
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import {onMount} from "svelte";
    import {getCurrentEpciId} from "../../api/currentEpci";
    import AddFiche from "../icons/AddFiche.svelte";
    import ActionReferentielExpandable from "./ActionReferentielExpandable.svelte";

    export let action: ActionReferentiel

    let renderNested = false
    const handleMore = () => {
        renderNested = true
    }

    let epciId = ''
    onMount(async () => {
        epciId = getCurrentEpciId()
    })
</script>

<section id="action-{action.id}">

    <a href="fiches/creation/?epci_id={epciId}&action_id={action.id}">
        <AddFiche/>
    </a>
    <h3 class="pr-28">({action.id}) {action.nom}</h3>
    <ActionStatus actionId={action.id}/>

    <div>
        {action.description}
    </div>

    <h2 class="text-2xl">Les actions</h2>
    <ul>
        {#each action.actions as action}
            <li>
                <ActionReferentielExpandable action={action}/>
            </li>

        {/each}
    </ul>
</section>
