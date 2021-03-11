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

    const requiredProperties = ["cart", "savedAt", "locked"];
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
          discountCodes: [],
          delivery: {
            required: false,
            option: "none",
            address: {
              recipient: "",
              line1: "",
              line2: "",
              city: "",
              postcode: "",
            }
          }
        },
        savedAt: new Date(),
        locked: false
      };
    }

    Cart.locked = localSave.locked;

    return {
      cart: localSave.cart,
      savedAt: localSave.savedAt,
      locked: localSave.locked
    };
  }

  saveToLocalStorage = () => {
    const localSave = {
      cart: this.cart,
      savedAt: new Date(),
      locked: Cart.locked
    }

    localStorage.setItem("localCartSave", JSON.stringify(localSave));

    Cart.registeredCallbacks.forEach((callback, i) => {
      callback(this);
    });
  }

  setDeliveryInformation = (required, option, address) => {
    if(!["none", "collection", "delivery"].includes(option)) {
      return false;
    }

    const requiredProperties = ["recipient", "line1", "line2", "city", "postcode"];

    for(let property of requiredProperties) {
      if(!address.hasOwnProperty(property)) {
        return false;
      }

      if(address[property] === undefined) {
        return false;
      }
    }

    this.cart.delivery = { required, option, address };
    this.saveToLocalStorage();
    return true;
  }

  addToCart = (shop, name, basePrice, quantity, submissionInformation, components, duplicateHash, image, upperLimit) => {
    if(Cart.locked) {
      return false;
    }

    return this.addToCartRaw({
      shop, name, basePrice, quantity, submissionInformation, components, duplicateHash, image, upperLimit
    });
  }

  addToCartRaw = (item) => {
    if(Cart.locked) {
      return false;
    }

    const requiredProperties = ["shop", "name", "basePrice", "quantity",
     "submissionInformation", "components", "duplicateHash", "image"];

    for(let property of requiredProperties) {
      if(!item.hasOwnProperty(property)) {
        return false;
      }

      if(item[property] === undefined) {
        return false;
      }
    }

    if(!item.hasOwnProperty("upperLimit") || item["upperLimit"] === undefined || item["upperLimit"] === null) {
      item.upperLimit = 50;
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
    if(Cart.locked) {
      return false;
    }

    if(code in this.cart.discountCodes) {
      return false;
    }

    // TODO: Implement

    return false;
  }

  removeFromCart = (index) => {
    if(Cart.locked) {
      return false;
    }

    if(index <= -1 || index >= this.cart.length) {
      return false;
    }

    this.cart.items.splice(index, 1);
    this.saveToLocalStorage();
    return true;
  }

  removeAllWithFilter = (predicate) => {
    if(Cart.locked) {
      return false;
    }

    this.cart.items = this.cart.items.filter(item => !predicate(item));
    this.saveToLocalStorage();
    return true;
  }

  clearCart = () => {
    if(Cart.locked) {
      return false;
    }

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

  adjustQuantity = (hash, amount) => {
    if(Cart.locked) {
      return false;
    }

    // Refresh the cart in case it is out of sync
    this.get();
    const duplicateIndex = this.getDuplicateIndex(hash);

    if(duplicateIndex === -1) {
      return false;
    }

    const { upperLimit, quantity } = this.cart.items[duplicateIndex];

    if(quantity + amount <= 0) {
      this.removeFromCart(duplicateIndex);
    } else {
      if(quantity + amount > upperLimit) {
        this.cart.items[duplicateIndex].quantity = upperLimit;
      } else {
        this.cart.items[duplicateIndex].quantity += amount;
      }
    }

    this.saveToLocalStorage();
    return true;
  }

  get = () => {
    const { cart } = this.initialiseCart();
    this.cart = cart;
    return this.cart;
  }

  registerCallbackOnSave = (callback) => {
    if(callback in Cart.registeredCallbacks) {
      return false;
    }

    Cart.registeredCallbacks.push(callback);
    return true;
  }

  setLocked = (locked) => {
    Cart.locked = locked;
    this.saveToLocalStorage();
    return true;
  }
}

Cart.registeredCallbacks = [];
Cart.locked = false;

export default Cart;
