<script lang="ts">
    import {fiche_action_avancement_noms} from "$generated/models/fiche_action_avancement_noms";

    export let avancementKey: string
    export let id: string


    const avancements = Object.entries(fiche_action_avancement_noms).map(([key, label]) => {
        return {'key': key, 'label': label}
    })
    
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
        border: none;
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
        border-right: 1px solid transparent;
        border-left: 1px solid transparent;
        z-index: 0;
    }

    [type="radio"]:not(:checked) + label::before {
        background-color: #F2F2F9;
    }

    [type="radio"]:checked + label::before {
        background-color: #fff;
        border-top-color: var(--bf500);
        border-right-color: var(--g300);
        border-left-color: var(--g300);
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
    <div class="fr-label">État d'avancement</div>

    <fieldset>
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
                    <span>{ avancement.label }</span>
                </label>
            </div>
        {/each}
    </fieldset>
</form>
