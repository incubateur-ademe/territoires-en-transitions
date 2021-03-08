import EpciButtonList from './components/EpciButtonList.svelte'

/**
 * Show epci navigation buttons on index page.
 */
new EpciButtonList({
    target: document.body.querySelector('nav.epcis')!,
})
