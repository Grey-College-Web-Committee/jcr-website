class Cart {
  constructor(username) {
    const { cart } = this.initialiseCart();
    this.cart = cart;

    this.saveToLocalStorage();
  }

  initialiseCart = () => {
    const storedCart = localStorage.getItem("localCartSave");
    let localSave = null;

    if(storedCart !== null) {
      try {
        localSave = JSON.parse(storedCart);
      } catch (error) {
        localSave = null;
      }
    }

    const requiredProperties = ["cart", "savedAt"];
    let rewrite = localSave === null;

    if(localSave !== null) {
      for(let property of requiredProperties) {
        if(!localSave.hasOwnProperty(property)) {
          rewrite = true;
        }

        if(localSave[property] === undefined) {
          return false;
        }
      }
    }

    if(localSave === null || rewrite) {
      localSave = {
        cart: {
          items: [],
          discountCodes: []
        },
        savedAt: null
      };
    }

    return {
      cart: localSave.cart,
      savedAt: localSave.savedAt
    };
  }

  saveToLocalStorage = () => {
    const localSave = {
      cart: this.cart,
      savedAt: new Date()
    }

    localStorage.setItem("localCartSave", JSON.stringify(localSave));
  }

  addToCart = (shop, name, basePrice, quantity, submissionInformation, components) => {
    return this.addToCartRaw({
      shop, name, basePrice, quantity, submissionInformation, components
    });
  }

  addToCartRaw = (item) => {
    const requiredProperties = ["shop", "name", "basePrice", "quantity",
     "submissionInformation", "components"];

    for(let property of requiredProperties) {
      if(!item.hasOwnProperty(property)) {
        return false;
      }

      if(item[property] === undefined) {
        return false;
      }
    }

    this.cart.items.push(item);
    this.saveToLocalStorage();
    return true;
  }

  applyDiscountCode = (code) => {
    if(code in this.cart.discountCodes) {
      return false;
    }

    // TODO: Implement

    return false;
  }

  removeFromCart = (index) => {
    if(index <= -1 || index >= this.cart.length) {
      return false;
    }

    this.cart.items.splice(index, 1);
    this.saveToLocalStorage();
    return true;
  }

  clearCart = () => {
    this.cart.items = [];
    this.saveToLocalStorage();
    return true;
  }

  get = () => {
    return this.cart;
  }
}

export default Cart;
