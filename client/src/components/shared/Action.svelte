<script lang="ts">
    import ActionStatus from './ActionStatus.svelte'
    import Button from "./Button.svelte";
    import {deleteCustomMesure} from "../../api/customMesure";
    import {createEventDispatcher} from "svelte";
    import {deleteById} from "../../api/store";

    export let id
    export let name
    export let description

    const dispatch = createEventDispatcher()
    const handleDelete = (event: Event): void => {
        event.preventDefault()

        const confirmDelete =
            confirm('Êtes-vous sûr•e de vouloir supprimer une de vos actions personnalisées ?')

        if (confirmDelete) {
            deleteCustomMesure(id)
            deleteById(id, 'custom_action')
            /**
             * TODO: remove this dispatcher when we have a global application state
             */
            dispatch('delete', id)
        }
    }
</script>

<section
        class="p-4 rounded my-4 action grid grid-cols-1 lg:grid-cols-12 lg:gap-1 bg-white "
        id="action-{id}">

    <div class="relative lg:col-span-7">
        <h3 class="pr-28">{name}</h3>
        <details class="expandable">
            <summary class="border border-gray-400 rounded px-2 py-1 absolute top-0
         right-0 cursor-pointer hover:bg-gray-200">Plus
            </summary>
            <div class="details-content">
                {description}
            </div>
            <Button
                    label="Supprimer"
                    colorVariant="bramble"
                    size="small"
                    on:click={handleDelete}
                    classNames=""
            />
        </details>
    </div>
    <ActionStatus actionId={id}/>
</section>
