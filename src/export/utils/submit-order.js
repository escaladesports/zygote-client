import fetch from 'isomorphic-fetch'
import stageState from '../state/stage'
import settingsState from '../state/settings'
import productsState from '../state/products'
import totalsState from '../state/totals'
import errorCheck from './error-check'
import getFormValues from './get-form-values'
import { triggerValidators } from './validators'
import displayError from '../utils/display-error'
import displayInfo from '../utils/display-info'
import clearMessages from './clear-messages'
import messagesState from '../state/status-messages'

export default async function submitOrder() {
	clearMessages()
	triggerValidators()
	await tick()

	// Check for required fields
	if (errorCheck()) return
	stageState.setState({ processing: true })

	const vals = getFormValues()
	if (settingsState.state.stripeApiKey){
		let { token } = await window.zygoteStripeInstance
			.createToken({ name: `Name` })
		vals.payment = token
	}

	vals.products = productsState.products
	vals.totals = totalsState.totals

	let data
	try {
		data = await fetch(settingsState.state.orderEndpoint, {
			method: `post`,
			body: JSON.stringify(vals),
		})
		data = await data.json()
		console.log(data)
	}
	catch(err){
		console.error(err)
	}

	if (!data.success) {
		if (data.messages){
			displayError(data.messages.error)
			displayInfo(data.messages.info)
		}
		if (!messagesState.state.errors.length){
			displayError(`We're sorry! There was an error with the server. Your order was not placed. Please try again later.`)
		}
		if(data.returnTo){
			stageState.setState({ stage: data.returnTo })
		}
		else {
			stageState.setState({ stage: `billing` })
		}
		return
	}

	stageState.setState({ stage: `success` })
}

function tick(){
	return new Promise((resolve) => {
		setTimeout(resolve, 1)
	})
}