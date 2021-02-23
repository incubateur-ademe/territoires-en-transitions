<script lang="typescript">
	import Button from './Button'

  export let id
  export let name

  const handleDelete = (event: Event): void => {
 		event.preventDefault()
 		console.log('Mesure delete confirm')
  }
</script>

<main>
  <a
    class="bg-white p-4 rounded my-4 grid grid-cols-1 lg:grid-cols-12 lg:gap-1"
    href="mesure_personnalisee.html?id={id}"
  >
    <h3 class="lg:col-span-8 text-xl font-semibold mb-6 pr-28">
      {name}
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