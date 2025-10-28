import { Router, Request, Response } from "express";
import { nowPaymentsService } from "../services/nowpayments";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "../db";
import { users, userPurchases } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Gera senha aleatória segura
 */
function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * POST /api/checkout/create
 * Create a new payment/invoice
 */
router.post("/create", async (req: Request, res: Response) => {
  try {
    const {
      productName,
      productPrice, // in USD
      customerEmail,
      customerData, // { accountNumber, eaType, platform, etc }
    } = req.body;

    if (!productName || !productPrice || !customerEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create payment with NOWPayments
    const payment = await nowPaymentsService.createPayment({
      price_amount: productPrice,
      price_currency: "usd",
      pay_currency: "btc", // Default to BTC, user can choose on NOWPayments page
      order_id: `order_${Date.now()}`,
      order_description: `${productName} - ${customerEmail}`,
      ipn_callback_url: `${process.env.BASE_URL || "https://sentrapartners.com"}/api/checkout/webhook`,
    });

    // Log payment for manual processing
    console.log("[Payment Created]", {
      paymentId: payment.payment_id,
      productName,
      customerEmail,
      customerData,
      amount: productPrice,
    });

    return res.json({
      success: true,
      paymentId: payment.payment_id,
      paymentUrl: payment.pay_address, // URL for customer to pay
      invoiceUrl: payment.invoice_url, // NOWPayments invoice page
    });
  } catch (error: any) {
    console.error("[Checkout Error]", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/checkout/webhook
 * Handle NOWPayments IPN webhook
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-nowpayments-sig"] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha512", process.env.NOWPAYMENTS_IPN_SECRET || "")
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("[Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const {
      payment_id,
      payment_status,
      pay_amount,
      pay_currency,
      order_id,
      order_description,
    } = req.body;

    console.log("[Webhook Received]", {
      paymentId: payment_id,
      status: payment_status,
      amount: pay_amount,
      currency: pay_currency,
      orderId: order_id,
      description: order_description,
    });

    // If payment is confirmed, create user automatically
    if (payment_status === "finished") {
      console.log("✅ [PAYMENT CONFIRMED]:", order_description);
      
      // Extract customer data from order_description or metadata
      // Format: "ProductName - email@example.com"
      const emailMatch = order_description.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      const customerEmail = emailMatch ? emailMatch[1] : null;
      
      if (customerEmail) {
        try {
          // Check if user already exists
          const db = await getDb();
          if (!db) throw new Error("Database not available");
          const existingUser = await db.select().from(users).where(eq(users.email, customerEmail)).limit(1);
          
          if (existingUser.length === 0) {
            // Generate random password
            const randomPassword = generateRandomPassword();
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            // Create user
            const [newUser] = await db.insert(users).values({
              email: customerEmail,
              password: hashedPassword,
              name: customerEmail.split('@')[0], // Use email prefix as name
              authMethod: "email",
              role: "client",
              isActive: true,
            });
            
            console.log("✅ [USER CREATED]", {
              userId: newUser.insertId,
              email: customerEmail,
              password: randomPassword, // LOG PASSWORD FOR MANUAL SENDING
            });
            
            // TODO: Send email with credentials
            // For now, password is logged above
          } else {
            console.log("ℹ️ [USER EXISTS]", customerEmail);
          }
        } catch (error: any) {
          console.error("❌ [USER CREATION ERROR]", error.message);
        }
      }
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("[Webhook Error]", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/checkout/status/:paymentId
 * Check payment status
 */
router.get("/status/:paymentId", async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const status = await nowPaymentsService.getPaymentStatus(paymentId);

    return res.json({
      success: true,
      status: status.payment_status,
      amount: status.pay_amount,
      currency: status.pay_currency,
    });
  } catch (error: any) {
    console.error("[Status Check Error]", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

