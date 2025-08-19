const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

// ----------------------
// Fetch Diamond Inventory
// ----------------------
async function fetchInventory() {
  const response = await fetch(
    "https://etherealdiamond.com/webServices/inventory_API.svc/GetInventory?username=diamondlibrary_b2c&password=diamondlibrary&page_index=1"
  );

  if (!response.ok) {
    throw new Error("Failed to fetch inventory, status " + response.status);
  }

  const data = await response.json();
  return data;
}

// ----------------------
// Push product to Shopify
// ----------------------
async function createShopifyProduct(item) {
  const url = `https://${SHOPIFY_STORE}/admin/api/2023-10/products.json`;

  const body = {
    product: {
      title: `Diamond ${item.STONE_NO}`,  // adjust fields as needed
      body_html: `
        <strong>Shape:</strong> ${item.SHAPE} <br/>
        <strong>Size:</strong> ${item.SIZE} <br/>
        <strong>Color:</strong> ${item.COLOR} <br/>
        <strong>Clarity:</strong> ${item.CLARITY}
      `,
      vendor: "Ethereal Diamonds",
      product_type: "Diamond",
      variants: [
        {
          price: item.AMOUNT || "1000.00",
          sku: item.STONE_NO,
          inventory_quantity: 1
        }
      ]
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": SHOPIFY_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (response.ok) {
    console.log("✅ Created product:", result.product.id);
  } else {
    console.error("❌ Shopify error:", result);
  }
}

// ----------------------
// Route to sync inventory
// ----------------------
app.get("/sync", async (req, res) => {
  try {
    const inventory = await fetchInventory();

    // Loop through items and create products in Shopify
    if (inventory.items && inventory.items.length > 0) {
      for (const item of inventory.items.slice(0, 5)) {  // limit for testing
        await createShopifyProduct(item);
      }
    }

    res.send("✅ Sync completed. Check Shopify products.");
  } catch (error) {
    console.error("❌ Error syncing:", error);
    res.status(500).send("Error syncing inventory: " + error.message);
  }
});

// ----------------------
// Start Server
// ----------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
