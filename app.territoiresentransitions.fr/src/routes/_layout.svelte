<script lang="ts">
    import Matomo, { asyncMatomo } from '../components/tracking/Matomo.svelte'
	import Tailwind from '../components/Tailwind.svelte'
	import Nav from '../components/shared/Nav/Nav.svelte'
	import {stores} from '@sapper/app'
	import {onMount} from 'svelte'

	export let segment: string;

	// Use Sapper store (called `page`) to track page changes.
	const { page } = stores()

	$: if ($page) {
		asyncMatomo.trackPageView()
	}

	onMount(() => {
		asyncMatomo.trackPageView()
	})
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