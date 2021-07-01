<script lang="ts">
    /**
     * Show the status input for a given action.
     *
     * This component is responsible for retrieving and storing status data.
     */

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

    let actionAvancementKey = '';

    let epci_id = ''

    /**
     * On input change store/overwrite action status.
     */
    let handleChange = async () => {
        const avancement = new ActionStatusStorable({
            epci_id: epci_id,
            action_id: actionId,
            avancement: actionAvancementKey
        })

        await actionStatusStore.store(avancement)
    }

    /**
     * Hack to clear avancement when clicking the selected label
     */
    const handleLabelClick = async (key: string) => {
        if (actionAvancementKey === key) {
            const avancement = new ActionStatusStorable({
                epci_id: epci_id,
                action_id: actionId,
                avancement: ''
            })

            await actionStatusStore.store(avancement)
            setTimeout(() => window.location.reload(), 200)
        }
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

<style>
    fieldset {
        display: flex;
        border: none;
    }

    div:not(:first-child) {
        margin-left: .5rem;
    }

    [type="radio"]:not(:checked),
    [type="radio"]:checked {
        position: absolute;
        left: -9999px;
    }

    [type="radio"]:not(:checked) + label,
    [type="radio"]:checked + label {
        position: relative;
        display: flex;
        align-items: center;
        margin-bottom: 0;
        padding: 0.5rem 1rem;
        font-weight: bold;
        cursor: pointer;
    }

    [type="radio"]:not(:checked) + label::before,
    [type="radio"]:checked + label::before,
    [type="radio"]:not(:checked) + label::after,
    [type="radio"]:checked + label::after {
        content: "";
    }

    [type="radio"]:not(:checked) + label::before,
    [type="radio"]:checked + label::before {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        display: block;
        border-top: 2px solid transparent;
        z-index: 0;
    }

    [type="radio"]:not(:checked) + label::before {
        background-color: #F2F2F9;
    }

    [type="radio"]:checked + label::before {
        background-color: #fff;
        border-top-color: var(--bf500);
    }

    [type="radio"]:checked + label {
        color: var(--bf500);
    }

    span {
        position: relative;
        z-index: 1;
    }
</style>

<form>
    <fieldset data-action-id="{actionId}">
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
                        on:click={() => handleLabelClick(avancement.key)}
                >
                    <span>{ avancement.label }</span>
                </label>
            </div>
        {/each}
    </fieldset>
</form>
