<script context="module" lang="ts">
    import {actions} from "../../../generated/data/actions_referentiels";
    import {ActionReferentiel} from "../../../generated/models/action_referentiel";

    const search = (actions: ActionReferentiel[], id: string): ActionReferentiel | void => {
        for (let action of actions) {
            if (action.id === id) return action;
            const found = search(action.actions, id);
            if (found) return found;
        }
    }

    export async function preload({params}) {
        const id = params.id;
        const found = search(actions, id);

        if (found) {
            return {action: found};
        } else {
            this.error(404, `Aucune action trouvée pour ${id}`);
        }
    }
</script>

<script lang="ts">
    import ActionReferentielPage from "../../components/shared/ActionReferentielPage.svelte";

    export let action: ActionReferentiel
</script>

<ActionReferentielPage action={action}/>


