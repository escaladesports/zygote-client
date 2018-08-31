import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config({ silent: true })
const stripe = Stripe(process.env.STRIPE_API_SECRET)

export async function handler({ body }, __, callback) {

	body = JSON.parse(body)

	// Validate product prices & stock here
	console.log(`Received from client:`, body)

	// Create empty result object to be sent later
	const res = {
		messages: {
			error: [],
		},
		modifications: [],
		meta: {},
	}

	// Create stripe order
	let order
	try {
		order = await stripe.orders.create({
			currency: `usd`,
			email: body.infoEmail,
			items: body.products.map(({ id, quantity }) => {
				return {
					type: `sku`,
					parent: id,
					quantity,
				}
			}),
			shipping: {
				name: body.infoName,
				address: {
					line1: body.shippingAddress1,
					line2: body.shippingAddress2,
					city: body.shippingCity,
					postal_code: body.shippingZip,
					country: `US`,
				},
			},
		})
		console.log(`Received from Stripe:`, order)
	}
	catch(err){
		order = {}
		console.error(`Received from Stripe:`, err)

		// Error messages
		// Create more consumer friendly inventory error message
		if (err.code === `out_of_inventory` || err.code === `resource_missing`){
			let item = Number(err.param
				.replace(`items[`, ``)
				.replace(`]`, ``))
			console.log(item)
			if(body.products[item]){
				res.messages.error.push(`Sorry! "${body.products[item].title}" is out of stock. Please lower the quantity or remove this product from your cart.`)
			}
		}
		else if (err.message) {
			res.messages.error.push(err.message)
		}
	}


	// Get tax
	if (order.items) {
		for (let i = order.items.length; i--;) {
			const item = order.items[i]
			if (item.type === `tax`) {
				res.modifications.push({
					id: `tax`,
					value: item.amount / 100,
					description: item.description,
				})
			}
		}
	}


	// Get shipping
	if (order.shipping_methods) {
		res.shippingMethods = order.shipping_methods.map(({ id, amount, description }) => {
			return {
				id,
				value: amount / 100,
				description,
			}
		})
	}

	res.success = order.statusCode === 200
	if (order.selected_shipping_method){
		res.selectedShippingMethod = order.selected_shipping_method
	}
	if (order.id) {
		res.meta.orderId = order.id
	}

	console.log(`Sending to client:`, res)


	// Response
	callback(null, {
		statusCode: 200,
		body: JSON.stringify(res),
	})
}