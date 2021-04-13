<script lang="ts">
    export let avancementKey: string
    export let id: string

    const avancements = [
        {
            key: 'non_concernee',
            label: 'Non concernée',
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


    /**
     * On input change store/overwrite action status.
     */
    const handleChange = (_): void => {


    }
</script>

<form class="lg:col-span-3 lg:col-end-12">
    <fieldset class="flex status">
        {#each avancements as avancement, index}
            <div>
                <input
                        bind:group={avancementKey}
                        on:change={handleChange}
                        value="{avancement.key}"
                        id="action-{id}_{avancement.key}"
                        name="action-{id}_status"
                        type="radio"
                        class="sr-only"
                >
                <label
                        for="action-{id}_{avancement.key}"
                        class={classes[index]}
                >
                    { avancement.label }
                </label>
            </div>
        {/each}
    </fieldset>
</form>
