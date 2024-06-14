const pizza_info = [];

export default pizza_info;

export async function init(){
    const response = await fetch('./scripts/data.json').then(response => response.json());
    response.forEach(pizza => pizza_info.push(pizza));
}

export function getPizzaById(id) {
    return pizza_info.find(pizza => pizza.id === id);
}