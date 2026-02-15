import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Roblox Inventory Viewer</title>
      </head>
      <body>
        <h1>Roblox Inventory Viewer</h1>
        <form id="inventoryForm">
          <label>Roblox User ID:</label><br/>
          <input type="text" id="userId" placeholder="Enter User ID" required /><br/>
          <label>Or .ROBLOSECURITY Cookie:</label><br/>
          <input type="text" id="roblosecurity" placeholder="Enter .ROBLOSECURITY" /><br/><br/>
          <button type="submit">Fetch Inventory</button>
        </form>
        <pre id="output"></pre>

        <script>
          const form = document.getElementById("inventoryForm");
          const output = document.getElementById("output");
          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const userId = document.getElementById("userId").value;
            const roblosecurity = document.getElementById("roblosecurity").value;

            const res = await fetch("/api/inventory", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, roblosecurity })
            });

            const data = await res.json();
            output.textContent = JSON.stringify(data, null, 2);
          });
        </script>
      </body>
    </html>
  `);
});

// API endpoint
app.post("/api/inventory", async (req, res) => {
  const { userId, roblosecurity } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const headers = {
    "User-Agent": "Roblox/WinInet",
    "Accept": "application/json",
  };
  if (roblosecurity) headers.Cookie = `.ROBLOSECURITY=${roblosecurity}`;

  const assetTypes = ["Hair", "Face", "Bundle"];
  const inventoryData = {};

  try {
    // Fetch inventory by type
    for (const type of assetTypes) {
      const resp = await fetch(
        `https://inventory.roblox.com/v1/users/${userId}/inventory?assetType=${type}`,
        { headers }
      );
      const json = await resp.json();
      inventoryData[type] = json.data || [];
    }

    // Fetch collectibles
    const collectiblesResp = await fetch(
      `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles`,
      { headers }
    );
    const collectiblesJson = await collectiblesResp.json();
    inventoryData.collectibles = collectiblesJson.data || [];

    return res.json({ success: true, inventory: inventoryData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
