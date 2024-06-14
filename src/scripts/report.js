import {getPizzaById, init as initPizza} from './pizza-list.js';

export function getCartFromLocalStorage(){
	const storageString = localStorage.getItem("cart")
	return storageString ? JSON.parse(storageString) : [];
}

let cartList;

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(init);

async function init() {
	await initPizza();

	cartList = getCartFromLocalStorage().map(cartItem => {

			const pizza = getPizzaById(cartItem.id)

			return {
				...cartItem,
				pizza
			}
		});

	drawPizzaAmountChart();
	drawPizzaSummaryPriceChart();
}

const chartConfig = {
	'title':'Summary pizza prices',
	'width': 600,
	'height': 600,
	'is3D': true,
	fontSize: 20,
	chartArea: {width: '90%'},
	titleTextStyle: {textAlign: 'center'},
	legend: {position: 'bottom'}
}

function drawPizzaAmountChart(){

	const list = cartList
		.map(cartItem => [cartItem.pizza.title, cartItem.amount])
		.reduce((acc, [name, amount]) => {
			if(acc.has(name)){
				acc.set(name, acc.get(name) + amount)
			} else {
				acc.set(name, amount);
			}
			return acc
		}, new Map());

	let data = new google.visualization.DataTable();
	data.addColumn('string', 'Name');
	data.addColumn('number', 'Amount');
	data.addRows(Array.from(list));

	chartConfig.title = 'Summary pizza amount';
	let options = chartConfig;

	let chart = new google.visualization.PieChart(document.getElementById('chart1'));
	chart.draw(data, options);
}

function drawPizzaSummaryPriceChart(){

	console.log(cartList);

	const list = cartList
		.map(cartItem => [cartItem.pizza.title, cartItem.pizza[cartItem.type].price, cartItem.amount])
		.reduce((acc, [name, price, amount]) => {
			if(acc.has(name)){
				acc.set(name, acc.get(name) + price * amount)
			} else {
				acc.set(name, price * amount);
			}
			return acc
		}, new Map());

	let data = new google.visualization.DataTable();
	data.addColumn('string', 'Name');
	data.addColumn('number', 'Price');
	data.addRows(Array.from(list));

	chartConfig.title = 'Summary pizza prices';

	let chart = new google.visualization.PieChart(document.getElementById('chart2'));
	chart.draw(data, chartConfig);
}