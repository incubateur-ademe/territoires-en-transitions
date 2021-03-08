import {getCurrentEpciId} from "./api/currentEpci";


const anchors = document.querySelectorAll<HTMLAnchorElement>('a')
let epciId: string
try {
    epciId = getCurrentEpciId()
} catch (_) {
    epciId = 'test'
}

/**
 * Inject epci_id parameter in anchors href if missing.
 */
for (let anchor of anchors) {
    let href = anchor.href
    if (href.includes('mailto:')) continue
    if (href.includes('epci_id')) continue

    if (href.includes('?')) href = `${href}&epci_id=${epciId}`
    else href = `${href}?epci_id=${epciId}`

    anchor.href = href
}

