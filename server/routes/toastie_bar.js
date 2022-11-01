// Get express
const express = require("express");
const router = express.Router();
// The database models
const { 
    User, Permission, PermissionLink,
    ToastieBarBread, ToastieBarFilling, ToastieBarMilkshake, ToastieBarSpecial, ToastieBarSpecialFilling, ToastieBarAdditionalStockType, ToastieBarAdditionalStock,
    ToastieBarOrder, ToastieBarComponentToastie, ToastieBarComponentToastieFilling, ToastieBarComponentSpecial, ToastieBarComponentMilkshake, ToastieBarComponentAdditionalItem
} = require("../database.models.js");
const { Op } = require("sequelize");
// Used to check admin permissions
const { hasPermission } = require("../utils/permissionUtils.js");

// Get all stock items that are not deleted including breads, fillings, milkshake, specials and additional items 
router.get("/stock", async (req, res) => {
    // Bread
    let breads;

    try {
        breads = await ToastieBarBread.findAll({
            where: {
                deleted: false
            },
            attributes: ["id", "name", "available", "pricePerUnit"]
        });
    } catch (error) {
        return res.status(500).json({ error: "Unable to retrieve breads" });
    }

    // Fillings
    let fillings;

    try {
        fillings = await ToastieBarFilling.findAll({
            where: {
                deleted: false
            },
            attributes: ["id", "name", "available", "pricePerUnit"]
        });
    } catch (error) {
        return res.status(500).json({ error: "Unable to retrieve fillings" });
    }

    // Milkshake
    let milkshakes;

    try {
        milkshakes = await ToastieBarMilkshake.findAll({
            where: {
                deleted: false
            },
            attributes: ["id", "name", "available", "pricePerUnit"]
        });
    } catch (error) {
        return res.status(500).json({ error: "Unable to retrieve milkshakes" });
    }

    // Additional Stock Types
    let additionalStockTypes;

    try {
        additionalStockTypes = await ToastieBarAdditionalStockType.findAll();
    } catch (error) {
        return res.status(500).json({ error: "Unable to retrieve additional stock types" });
    }

    // Process the items for each type into their own arrays
    let additionalStock = {};

    // If there exists options
    if(additionalStockTypes.length !== 0) {
        // Put them in the map
        for(const additionalStockType of additionalStockTypes) {
            const { id, name } = additionalStockType;
            let additionalStockRecords;

            // Get the items belonging to the type
            try {
                additionalStockRecords = await ToastieBarAdditionalStock.findAll({
                    where: {
                        typeId: id,
                        deleted: false
                    },
                    attributes: ["id", "name", "available", "typeId", "pricePerUnit"],
                })
            } catch (error) {
                return res.status(500).json({ error: `Unable to get additional stock items for type ID ${id}`});
            }

            // Don't bother if there are no records for the type
            if(additionalStockRecords.length === 0) {
                continue;
            }

            additionalStock[name] = additionalStockRecords;
        }
    }

    // Specials
    const now = new Date();
    let rawSpecials;

    try {
        rawSpecials = await ToastieBarSpecial.findAll({
            where: {
                startDate: {
                    [Op.lte]: now
                },
                endDate: {
                    [Op.gte]: now 
                }
            },
            include: [
                {
                    model: ToastieBarSpecialFilling,
                    include: [{
                        model: ToastieBarFilling,
                        attributes: ["id", "name", "available", "pricePerUnit"]
                    }]
                }
            ],
            attributes: ["id", "name", "description", "startDate", "endDate"]
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Unable to retrieve specials" });
    }

    let specials = [];

    // Process the specials into a better format than the raw results
    // Also checks that their fillings are available
    for(const special of rawSpecials) {
        const { id, name, description, startDate, endDate, priceWithoutBread } = special;
        let processedSpecial = { id, name, description, startDate, endDate, priceWithoutBread };
        let fillings = [];
        let available = true;

        // ToastieBarSpecialFilling is the join of the many-to-many relationship
        for(const fillingLink of special.ToastieBarSpecialFillings) {
            const filling = fillingLink.ToastieBarFilling;
            // Require all fillings to be available for the special to be available
            // Decided not to check for deleted as they may use a special to get rid of some stock for a special filling
            available = available && filling.available;// && !filling.deleted;

            // Price of fillings is already accounted for in the special setup
            fillings.push(filling.name);
        }

        processedSpecial.fillings = fillings;
        processedSpecial.available = available;

        specials.push(processedSpecial);
    }

    // Send the results back
    return res.status(200).json({
        breads, fillings, milkshakes, specials, additionalStock
    })
});

// Place an order
router.post("/order", async (req, res) => {
    
});

// Set the module export to router so it can be used in server.js
// Allows it to be assigned as a route
module.exports = router;
