<script lang="ts">
    import Dialog from "../../components/shared/Dialog.svelte";
    import {createEventDispatcher} from "svelte"
    import { actions } from '../../../generated/data/actions_referentiels'

    const dispatch = createEventDispatcher()
    const close = () => dispatch('close')
    const thematiquesWithActions = actions.reduce((acc, action) => {
        const thematiqueId = action['thematique_id']
        let actions = []

        if (acc[thematiqueId]) actions = acc[thematiqueId]

        actions.push(action)
        acc[thematiqueId] = actions

        return acc
    }, {})
</script>

<Dialog ariaLabelledBy="dialog-title" handleClose={close}>
    <div class="bg-gray-100">
        <header class="bg-white p-4">
            <a class="cursor-pointer underline" on:click={() => close() }>Retourner à la fiche</a>
            <h2 id="dialog-title">Lier une action</h2>
        </header>
        <div class="p-3 focus:bg-gray-100">

            {#each Object.entries(thematiquesWithActions) as [thematique, actions] }
                <h3>{thematique}</h3>
                {#each actions as action}
                    <h4>{action.nom}</h4>
                {/each}
            {/each}
        </div>
    </div>
</Dialog>