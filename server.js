const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors"); // 👈 add cors
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS so Shopify can fetch this API
app.use(
  cors({
    origin: "*" // ⚠️ for testing allow all. Later replace with "https://yourstore.myshopify.com"
  })
);

/**
 * Fetch inventory from diamond API
 */
async function fetchInventory() {
  const response = await fetch(
    "https://etherealdiamond.com/webServices/inventory_API.svc/GetInventory?username=diamondlibrary_b2c&password=diamondlibrary&page_index=1"
  );

  if (!response.ok) {
    throw new Error("Failed to fetch inventory, status " + response.status);
  }

  // First parse outer JSON
  const data = await response.json();

  // The API wraps actual JSON as a string under `d`
  const parsed = JSON.parse(data.d);

  console.log("✅ Parsed Inventory:", parsed);

  return parsed;
}

/**
 * API route to trigger sync
 */
app.get("/sync", async (req, res) => {
  try {
    const inventory = await fetchInventory();

    // ✅ Send pure JSON (not HTML <pre>)
    res.json(inventory);
  } catch (error) {
    console.error("❌ Error syncing:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
