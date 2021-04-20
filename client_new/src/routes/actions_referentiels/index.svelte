<script lang="ts">
    import {onMount} from "svelte";
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";
    import ActionReferentielLink from "../../components/shared/ActionReferentielLink.svelte";
    import ReferentielSearchBar from "../../components/shared/ReferentielSearchBar.svelte";

    const possiblyId = new RegExp('^\\d+');

    let timer: number;
    let needle: string;
    let allActions: ActionReferentiel[] = [];
    let displayed: ActionReferentiel[] = [];

    onMount(async () => {
        let referentiel = await import("../../../generated/data/actions_referentiels")
        allActions = displayed = referentiel.actions
    });
</script>

<ReferentielSearchBar actions={allActions} bind:matches={displayed}/>

{#each displayed as action}

    <ActionReferentielLink action={action}/>
{/each}
