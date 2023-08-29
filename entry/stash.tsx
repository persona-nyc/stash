import { hydrateRoot } from 'react-dom/client'
import StashApp from '../components/AppEntry'

let stash_app_el = document.getElementById('stash_app')

if (stash_app) {
	let root = hydrateRoot(stash_app_el, { hydrate: true })
	root.render(<StashApp />, stash_app)
} else {
	let root = hydrateRoot(stash_app_el, { hydrate: false })
	root.render(<div>no element stash_app found</div>, stash_app)
}