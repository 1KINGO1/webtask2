import pizzaList, {getPizzaById, init as pizzaInit} from "./pizza-list.js";

const pizzaSelectWrapper = document.getElementById("pizza-select-wrapper");
const cartWrapper = document.getElementById("cart");
const filterTitle = document.getElementById("filter-title");
const clearCartButton = document.getElementById("clear-cart");
const cartTitle = document.getElementById("cart-title");
const cartSum = document.getElementById("cart-sum");
const filters = document.getElementById("filters");

const orderButton = document.getElementById("order-button");
const reportButton = document.getElementById("report-button");

const filterIds = {
    "М’ясна піца": "meat-filter",
    "Вега піца": "vega-filter",
    "Морська піца": "seafood-filter",
    "Грибна піца": "mushrooms-filter",
    "Ананасова піца": "pineapple-filter"
}


/*
CartItem {
    id: number,
    type: small_size | big_size,
    amount: number
}[]
 */
let cart = getCartFromLocalStorage() || [];

// pizza ID -> pizzaElement
const pizzaElements = new Map();

// CartItem -> cartElement
const cartElements = new Map();

let appliedFilters = ["all"];



async function init() {
    await pizzaInit();

    renderPizzaCountElement();
    renderCartTitleElement();
    pizzaList.forEach(renderPizzaItem);
    cart.forEach(renderPizzaCartElement);

    renderCartSum();
    renderCartButtons();

    reportButton.addEventListener("click", () => {
        window.location.href = "report.html";
    })

    addFiltersEventListener();
    clearCartButton.addEventListener("click", () => {
        clearCart();
    });
}
init();

function addFiltersEventListener(){
    filters.addEventListener("change", (e) => {
        const target = e.target;

        if (!Object.values(filterIds).includes(target.id) && target.id !== "all") return;

        const checkBoxes = filters.getElementsByTagName("input");

        appliedFilters = [];

        if (target.id === "all") {
            Array.from(checkBoxes).forEach(checkbox => {
                checkbox.checked = target === checkbox;
                appliedFilters.push(checkbox.id);
            })
        }
        else {
            Array.from(checkBoxes).forEach(checkbox => {
                if (checkbox.id === "all") {
                    checkbox.checked = false;
                    return;
                }
                if (checkbox.checked) {
                    appliedFilters.push(checkbox.id);
                }
            })
        }

        applyFilters();
    });
}
function applyFilters(){
    let pizzaCount = 0;

    for (let entry of pizzaElements.entries()){
        const pizzaId = entry[0];
        const pizza = getPizzaById(pizzaId);
        const element = entry[1];

        if (appliedFilters.includes(filterIds[pizza.type]) || appliedFilters.includes("all")){
            element.style.display = "block";
            pizzaCount++;
            continue;
        }

        element.style.display = "none";
    }
}

function renderPizzaCountElement(){
    filterTitle.innerHTML = `Усі піци <span>${pizzaList.length}</span>`
}
function renderCartTitleElement(){
    cartTitle.innerHTML = `Замовлення <span>${cart.length}</span>`;
}

function renderPizzaItem(pizza){
    const pizzaWrapper = document.createElement("div");
    pizzaWrapper.dataset.id = pizza.id;
    pizzaWrapper.className = "pizza" + (pizza.is_new ? " new" : "") + (pizza.is_popular ? " popular" : "");

    // Getting pizza content
    let pizzaContent = Object.values(pizza.content).flat(1).join(", ");
    pizzaContent = pizzaContent[0].toUpperCase() + pizzaContent.slice(1);

    pizzaWrapper.innerHTML = `
                <div class="pizza__image">
                    <img src="${pizza.icon}" alt="Піца ${pizza.title}">
                </div>
                <div class="pizza__info">
                    <p class="pizza__title">${pizza.title}</p>
                    <span class="pizza__type">${pizza.type}</span>
                    <p class="pizza__ingredients">${pizzaContent}</p>
                </div>
                <div class="pizza__prices">
                    ${pizza.small_size ? `
                        <div class="pizza__price">
                            <span class="pizza__price-diameter">${pizza.small_size.size}</span>
                            <span class="pizza__price-weight">${pizza.small_size.weight}</span>
                            <span class="pizza__price-sum">${pizza.small_size.price}</span>
                        <button class="button pizza__price-buy-button" data-type="small_size">Купити</button>
                    </div>
                    ` : ""}
                   ${pizza.big_size ? `
                       <div class="pizza__price">
                            <span class="pizza__price-diameter">${pizza.big_size.size}</span>
                            <span class="pizza__price-weight">${pizza.big_size.weight}</span>
                            <span class="pizza__price-sum">${pizza.big_size.price}</span>
                            <button class="button pizza__price-buy-button" data-type="big_size">Купити</button>
                        </div>
                   ` : ""}
                    
                </div>`;
    addPizzaEventListeners(pizzaWrapper);
    pizzaSelectWrapper.appendChild(pizzaWrapper);

    pizzaElements.set(pizza.id, pizzaWrapper);
}
function addPizzaEventListeners(pizzaWrapper){
    pizzaWrapper.addEventListener("click", (e) => {
        const target = e.target;

        if (!target.className.includes("pizza__price-buy-button")) return;

        const type = target.dataset.type || "small_size";
        const pizza_id = pizzaWrapper.dataset.id;
        addPizzaToCart({id: +pizza_id, type});
    })
}

function addPizzaToCart(pizzaToAdd){
    const existingPizzaIndex = cart.findIndex(pizza => pizza.id === pizzaToAdd.id && pizza.type === pizzaToAdd.type);

    let cartItem;

    if (existingPizzaIndex >= 0) {
        cartItem = cart[existingPizzaIndex];
        cartItem.amount += 1;
    }
    else {
        cartItem = {...pizzaToAdd, amount: 1};
        cart.push(cartItem);
    }

    renderPizzaCartElement(cartItem);
    renderCartSum();
    renderCartButtons();
    saveCartToLocalStorage();
}
function removePizzaFromCart(cartItem){
    cart = cart.filter(cartI => cartI !== cartItem);
    renderCartButtons();
    saveCartToLocalStorage();
}

function renderCartButtons(){
    orderButton.disabled = cart.length === 0;
    reportButton.disabled = cart.length === 0;
}

export function saveCartToLocalStorage(){
    localStorage.setItem("cart", JSON.stringify(cart));
}
export function getCartFromLocalStorage(){
    const storageString = localStorage.getItem("cart")
    return storageString ? JSON.parse(storageString) : [];
}

function renderPizzaCartElement(cartItem){
    const pizza = getPizzaById(cartItem.id);
    if (!pizza) return;

    const type = cartItem.type;

    let existingElement = cartElements.get(cartItem);

    const cartItemWrapper = existingElement || document.createElement("div");
    cartItemWrapper.className = "selected-pizza";
    cartItemWrapper.style.backgroundImage = `url('${pizza.icon}')`;
    cartItemWrapper.innerHTML = `
                <p class="selected-pizza__title">
                    ${pizza.title} ${type === 'small_size' ? " (Мала)" : " (Велика)"}
                </p>
                <div class="selected-pizza__details">
                    <p class="selected-pizza__diameter">${pizza[type].size}</p>
                    <p class="selected-pizza__weight">${pizza[type].weight}</p>
                </div>
                <div class="selected-pizza__bottom-panel">
                    <p class="selected-pizza__price">${pizza[type].price}</p>
                    <div class="selected-pizza__control">
                        <button class="selected-pizza__decrease" data-action="decrease">-</button>
                        <span class="selected-pizza__count">${cartItem.amount}</span>
                        <button class="selected-pizza__increase" data-action="increase">+</button>
                        <button class="selected-pizza__remove" data-action="remove">×</button>
                    </div>
                </div>
    `;

    cartElements.set(cartItem, cartItemWrapper);

    if (!existingElement) {
        addPizzaCartElementEventListeners(cartItem);
        cartWrapper.appendChild(cartItemWrapper);
    }

    renderCartTitleElement();
}
function addPizzaCartElementEventListeners(cartItem){
    const cartItemWrapper = cartElements.get(cartItem);

    cartItemWrapper.addEventListener("click", (e) => {
        const target = e.target;

        if (target.dataset.action === 'increase') {
            cartItem.amount += 1;
            renderPizzaCartElement(cartItem);
        }

        if (target.dataset.action === 'decrease') {
            cartItem.amount -= 1;
            if (cartItem.amount <= 0) removePizzaCartElement(cartItem);
            else renderPizzaCartElement(cartItem);
        }

        if (target.dataset.action === 'remove') {
            removePizzaCartElement(cartItem);
        }

        saveCartToLocalStorage();
        renderCartTitleElement();
        renderCartSum();
    });
}
function removePizzaCartElement(cartItem){
    const element = cartElements.get(cartItem);
    if (!element) return;

    element.remove();
    removePizzaFromCart(cartItem);
    renderCartSum();
    cartElements.delete(cartItem);
}
function renderCartSum(){
    const sum = cart.reduce((prev, current) => {
        const pizza = getPizzaById(current.id);
        if (!pizza) return prev;
        return prev + pizza[current.type].price * current.amount;
    }, 0);

    cartSum.innerHTML = `${sum} грн.`;
}
function clearCart(){
    cartElements.clear();
    cartWrapper.innerHTML = "";
    cart = [];

    renderCartTitleElement();
    renderCartSum();
    renderCartButtons();

    saveCartToLocalStorage();
}