<script lang="ts">
    import Matomo from '../components/tracking/Matomo.svelte'
	import Tailwind from '../components/Tailwind.svelte'
	import Nav from '../components/shared/Nav/Nav.svelte'

	export let segment: string;
</script>

<style>
	main {
		position: relative;
		max-width: 70em;
		padding: 0 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>

<Matomo />
<Tailwind />
<Nav {segment}/>

<main>
	<slot></slot>
</main>