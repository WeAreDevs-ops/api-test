import express from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple frontend
app.get("/", (req, res) => {
  res.send(`
    <h2>Roblox Inventory Viewer</h2>
    <form method="POST" action="/inventory">
      <input name="cookie" placeholder=".ROBLOSECURITY" style="width:400px" required />
      <br><br>
      <button type="submit">Fetch Inventory</button>
    </form>
  `);
});

app.post("/inventory", async (req, res) => {
  const { cookie } = req.body;
  if (!cookie) return res.status(400).json({ error: "Missing cookie" });

  const headers = {
    "Cookie": `.ROBLOSECURITY=${cookie}`,
    "User-Agent": "Roblox/WinInet",
    "Accept": "application/json"
  };

  try {
    // 1️⃣ Validate cookie + get authenticated user
    const authRes = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers
    });

    if (!authRes.ok) {
      return res.status(401).json({ error: "Invalid RobloxSecurity cookie" });
    }

    const userData = await authRes.json();
    const userId = userData.id;

    // 2️⃣ Fetch inventory categories
    const assetTypes = ["Hair", "Face", "Bundle"];
    const inventory = {};

    for (const type of assetTypes) {
      const invRes = await fetch(
        `https://inventory.roblox.com/v1/users/${userId}/inventory?assetType=${type}&limit=100`,
        { headers }
      );

      const invJson = await invRes.json();
      inventory[type] = invJson.data || [];
    }

    // 3️⃣ Fetch collectibles
    const colRes = await fetch(
      `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100`,
      { headers }
    );

    const colJson = await colRes.json();
    inventory.collectibles = colJson.data || [];

    // 4️⃣ Return REAL result
    res.json({
      success: true,
      user: {
        id: userData.id,
        name: userData.name,
        displayName: userData.displayName
      },
      inventory
    });

  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
