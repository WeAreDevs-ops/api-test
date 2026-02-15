const express = require("express");
const fetch = require("node-fetch");
const app = express();

// Parse JSON body
app.use(express.json());

// Serve frontend from public folder
app.use(express.static("public"));

// Inventory API endpoint
app.post("/api/inventory", async (req, res) => {
  const { userId, roblosecurity } = req.body;

  if (!userId || !roblosecurity) {
    return res.status(400).json({ error: "Missing userId or roblosecurity" });
  }

  const headers = {
    "Cookie": `.ROBLOSECURITY=${roblosecurity}`,
    "User-Agent": "Roblox/WinInet",
    "Accept": "application/json"
  };

  try {
    const endpoints = {
      hair: `https://inventory.roblox.com/v1/users/${userId}/inventory?assetType=Hair&limit=100`,
      face: `https://inventory.roblox.com/v1/users/${userId}/inventory?assetType=Face&limit=100`,
      bundle: `https://inventory.roblox.com/v1/users/${userId}/inventory?assetType=Bundle&limit=100`,
      collectibles: `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100`
    };

    const results = {};

    for (let key in endpoints) {
      const response = await fetch(endpoints[key], { headers });
      const data = await response.json();
      results[key] = data.data || [];
    }

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// Set port from environment (Railway provides it)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
