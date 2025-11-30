const express = require("express");
const cors = require("cors");
require("dotenv").config();   // <-- load environment variables

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: "Amount is required" });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    res.status(200).json(order);
  } catch (err) {
    console.error("Razorpay error:", err);
    res.status(500).json({ error: "Razorpay order creation failed" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
