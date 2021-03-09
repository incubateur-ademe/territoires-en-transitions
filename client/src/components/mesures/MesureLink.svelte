<script lang="typescript">
    import Button from '../shared/Button'
    import {createEventDispatcher} from 'svelte'
    import {MesureCustomStorable} from "../../storables/MesureCustomStorable";
    import {mesureCustomStore} from "../../api/localStore";

    export let mesure: MesureCustomStorable

    const dispatch = createEventDispatcher()
    const handleDelete = (event: Event): void => {
        event.preventDefault()

        const confirmDelete =
            confirm('Êtes-vous sûr•e de vouloir supprimer une de vos mesures personnalisées ?')

        if (confirmDelete) {
            mesureCustomStore.deleteById(mesure.id)
            /**
             * TODO: remove this dispatcher when we have a global application state and use
             *       <MesuresLinks> props to hydrate mesures list.
             */
            dispatch('delete', mesure.id)
        }
    }
</script>

<main>
    <a
            class="bg-white p-4 rounded my-4 grid grid-cols-1 lg:grid-cols-12 lg:gap-1"
            href="mesure_personnalisee.html?epci_id={mesure.epci_id}&mesure_uid={mesure.uid}"
    >
        <h3 class="lg:col-span-8 text-xl font-semibold mb-6 pr-28">
            {mesure.name}
            <Button
                    label="Supprimer"
                    colorVariant="bramble"
                    size="small"
                    on:click={handleDelete}
                    classNames="ml-6"
            />
        </h3>
    </a>
</main>