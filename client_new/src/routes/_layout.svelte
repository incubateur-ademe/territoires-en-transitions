<script lang="ts">
	import Tailwind from '../components/Tailwind.svelte'
	import Nav from '../components/shared/Nav.svelte'

	export let segment: string;
</script>

<style>
	main {
		position: relative;
		max-width: 56em;
		background-color: white;
		padding: 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>

<Tailwind />
<Nav {segment}/>

<main>
	<slot></slot>
</main>