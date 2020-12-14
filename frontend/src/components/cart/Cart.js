class Cart {
  constructor() {
    const { cart } = this.initialiseCart();
    this.cart = cart;
    this.registeredCallbacks = [];

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

    Cart.registeredCallbacks.forEach((callback, i) => {
      callback(this);
    });
  }

  addToCart = (shop, name, basePrice, quantity, submissionInformation, components, duplicateHash) => {
    return this.addToCartRaw({
      shop, name, basePrice, quantity, submissionInformation, components, duplicateHash
    });
  }

  addToCartRaw = (item) => {
    const requiredProperties = ["shop", "name", "basePrice", "quantity",
     "submissionInformation", "components", "duplicateHash"];

    for(let property of requiredProperties) {
      if(!item.hasOwnProperty(property)) {
        return false;
      }

      if(item[property] === undefined) {
        return false;
      }
    }

    if(item.duplicateHash === null) {
      const { shop, name, basePrice, submissionInformation, components } = item;
      item.duplicateHash = this.generateHashCode(JSON.stringify({ shop, name, basePrice, submissionInformation, components }));
    }

    const duplicateIndex = this.getDuplicateIndex(item.duplicateHash);

    if(duplicateIndex !== -1) {
      this.cart.items[duplicateIndex].quantity += 1;
    } else {
      this.cart.items.push(item);
    }

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

  // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
  // https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  generateHashCode = (str) => {
    let hash = 0;
    let i, chr;

    for(i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }

    return hash;
  }

  getDuplicateIndex = (hash) => {
    const duplicates = this.cart.items.filter(item => item.duplicateHash === hash);

    if(duplicates.length === 0) {
      return -1;
    }

    if(duplicates.length > 1) {
      console.log("Warning: Multiple unmerged duplicates");
      // shouldn't happen
    }

    const duplicate = duplicates[0];
    return this.cart.items.indexOf(duplicate);
  }

  get = () => {
    return this.cart;
  }

  registerCallbackOnSave = (callback) => {
    if(callback in Cart.registeredCallbacks) {
      return false;
    }

    Cart.registeredCallbacks.push(callback);
    return true;
  }
}

Cart.registeredCallbacks = [];

export default Cart;
