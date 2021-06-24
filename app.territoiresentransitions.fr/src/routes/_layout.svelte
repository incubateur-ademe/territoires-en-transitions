<script lang="ts">
	import Matomo, {asyncMatomo} from '../components/tracking/Matomo.svelte'
	import {stores} from '@sapper/app'
	import {onMount} from 'svelte'
	import Header from 'components/Layout/Header.svelte'
	import Footer from 'components/Layout/Footer.svelte'
	import Head from './_head.svelte'
	import Nav from './../components/shared/NavV2/Nav.svelte'
	import NavDev from './../components/shared/NavV2/NavDev.svelte'

	export let segment: string;

	// Use Sapper store (called `page`) to track page changes.
	const {page} = stores()

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

<div>

</div>
<Head/>
<Matomo />
<Header>
	<Nav slot="nav" segment={segment}/>
	<NavDev slot="secondary" />
</Header>

<main>
	<slot></slot>
</main>

<Footer>
	<div class="fr-footer__bottom">
		<ul class="fr-footer__bottom-list">
			<li class="fr-footer__bottom-item">
				<a class="fr-footer__bottom-link" href="/mentions-legales" target="_self">Mentions légales</a>
			</li>
			<li class="fr-footer__bottom-item">
				<a class="fr-footer__bottom-link" href="https://www.ademe.fr/lademe/infos-pratiques/politique-protection-donnees-a-caractere-personnel" rel="external" target="_blank">Protection des données</a>
			</li>
		</ul>
	</div>
</Footer>