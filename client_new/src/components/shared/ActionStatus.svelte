<script lang="ts">
    import {onMount} from "svelte";

    import {getCurrentEpciId} from "../../api/currentEpci";
    import {ActionStatusStorable} from "../../storables/ActionStatusStorable";
    import {HybridStore} from "../../api/hybridStore";

    export let actionId

    const avancements = [
        {
            key: 'non_concernee',
            label: 'NC',
        },
        {
            key: 'pas_faite',
            label: 'Pas faite',
        },
        {
            key: 'programmee',
            label: 'Prévue',
        },
        {
            key: 'en_cours',
            label: 'En cours',
        },
        {
            key: 'faite',
            label: 'Faite',
        },
    ]

    const classes = [
        'border rounded-l flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400',
        'border-t border-r border-b flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400',
        'border-t border-r border-b flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400',
        'border-t border-r border-b flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400',
        'border-t border-r border-b rounded-r flex-1 block whitespace-nowrap px-2 py-1 cursor-pointer border-gray-400',
    ]

    let actionAvancementKey = 'pas_faite';

    let epci_id = ''

    /**
     * On input change store/overwrite action status.
     */
    const handleChange = (_): void => {
        const avancement = new ActionStatusStorable({
            epci_id: epci_id,
            action_id: actionId,
            avancement: actionAvancementKey
        })

        actionStatusStore.store(avancement)
    }

    let actionStatusStore: HybridStore<ActionStatusStorable>;

    /**
     * Get data from store.
     */
    const fetch = async () => {
        const status = await actionStatusStore.retrieveById(`${epci_id}/${actionId}`)
        if (status) actionAvancementKey = status.avancement;
    }

    onMount(async () => {
        const hybridStores = await import ("../../api/hybridStores");
        actionStatusStore = hybridStores.actionStatusStore;
        epci_id = getCurrentEpciId()
        await fetch();
    });

</script>

<form class="lg:col-span-3 lg:col-end-12">
    <fieldset class="flex status" data-action-id="{actionId}">
        {#each avancements as avancement, index}
            <div>
                <input
                        bind:group={actionAvancementKey}
                        on:change={handleChange}
                        value="{avancement.key}"
                        id="action-{actionId}_{avancement.key}"
                        name="action-{actionId}_status"
                        type="radio"
                        class="sr-only"
                >
                <label
                        for="action-{actionId}_{avancement.key}"
                        class={classes[index]}
                >
                    { avancement.label }
                </label>
            </div>
        {/each}
    </fieldset>
</form>
