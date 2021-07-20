<script context="module" lang="ts">
    /**
	 * @type {import('@sveltejs/kit').Load}
	 */
    import {actions} from "$generated/data/actions_referentiels";
    import {searchById} from "./utils";


    export async function load({page}) {
        
        const id = page.params.id;
        const found = searchById(actions, id);
        if (found) {
            return {props: {actionId: found.id}};
        } else {
            this.error(404, `Aucune action trouvée pour ${id}`);
        }
    }
</script>

<script lang="ts">
    import ActionReferentielPage from "./_ActionReferentielPage.svelte";

    export let actionId: string
    $: action = searchById(actions, actionId)
</script>

<div>
    {#if action}
        <ActionReferentielPage action={action}/>
    {/if}
</div>


