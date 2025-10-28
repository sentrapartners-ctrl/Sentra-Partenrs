import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { payments, products, eaOrders } from "../../drizzle/schema-payments";
import { nowPaymentsService } from "../services/nowpayments";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { generateEACode, saveEACode, compileEA } from "../services/eaGenerator";
// import { sendEADeliveryEmail } from "../services/emailService";

const router = Router();

/**
 * POST /api/checkout/create
 * Create a new payment/invoice
 */
router.post("/create", async (req: Request, res: Response) => {
  try {
    const {
      productId,
      customerEmail,
      customerData, // { accountNumber, eaType, platform, duration, etc }
      successUrl,
      cancelUrl,
    } = req.body;

    if (!productId || !customerEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const db = getDb();

    // Get product
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    // Create payment record
    const [payment] = await db.insert(payments).values({
      productId,
      orderId,
      priceAmount: product.priceUsd,
      priceCurrency: "USD",
      status: "pending",
      customerEmail,
      customerData: JSON.stringify(customerData),
      successUrl: successUrl || `https://sentrapartners.com/checkout/success?order=${orderId}`,
      cancelUrl: cancelUrl || `https://sentrapartners.com/checkout/cancel?order=${orderId}`,
    });

    // Create invoice with NOWPayments
    const invoice = await nowPaymentsService.createInvoice({
      price_amount: parseFloat(product.priceUsd),
      price_currency: "USD",
      order_id: orderId,
      order_description: `${product.name} - ${customerEmail}`,
      ipn_callback_url: `https://sentrapartners.com/api/checkout/webhook`,
      success_url: successUrl || `https://sentrapartners.com/checkout/success?order=${orderId}`,
      cancel_url: cancelUrl || `https://sentrapartners.com/checkout/cancel?order=${orderId}`,
    });

    // Update payment with invoice info
    await db.update(payments)
      .set({
        invoiceId: invoice.id,
        invoiceUrl: invoice.invoice_url,
      })
      .where(eq(payments.id, payment.insertId));

    res.json({
      success: true,
      orderId,
      invoiceUrl: invoice.invoice_url,
      invoiceId: invoice.id,
    });
  } catch (error: any) {
    console.error("[Checkout] Error creating payment:", error);
    res.status(500).json({ error: error.message || "Failed to create payment" });
  }
});

/**
 * POST /api/checkout/webhook
 * NOWPayments IPN webhook
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-nowpayments-sig"] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature
    if (!nowPaymentsService.verifyIPN(signature, payload)) {
      console.error("[Checkout] Invalid IPN signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const {
      payment_id,
      payment_status,
      pay_amount,
      pay_currency,
      order_id,
      price_amount,
      price_currency,
    } = req.body;

    console.log(`[Checkout] IPN received: ${order_id} - ${payment_status}`);

    const db = getDb();

    // Find payment
    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, order_id),
    });

    if (!payment) {
      console.error(`[Checkout] Payment not found: ${order_id}`);
      return res.status(404).json({ error: "Payment not found" });
    }

    // Update payment status
    await db.update(payments)
      .set({
        paymentId: payment_id,
        payAmount: pay_amount,
        payCurrency: pay_currency,
        status: payment_status,
        paidAt: payment_status === "finished" ? new Date() : undefined,
      })
      .where(eq(payments.orderId, order_id));

    // If payment is finished, process delivery
    if (payment_status === "finished" && !payment.delivered) {
      await processDelivery(payment);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[Checkout] Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/checkout/status/:orderId
 * Get payment status
 */
router.get("/status/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const db = getDb();

    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, orderId),
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({
      orderId: payment.orderId,
      status: payment.status,
      delivered: payment.delivered,
      deliveryData: payment.deliveryData ? JSON.parse(payment.deliveryData) : null,
      invoiceUrl: payment.invoiceUrl,
    });
  } catch (error: any) {
    console.error("[Checkout] Error getting status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process delivery after payment confirmation
 */
async function processDelivery(payment: any) {
  try {
    console.log(`[Checkout] Processing delivery for order: ${payment.orderId}`);
    
    const db = getDb();
    const customerData = JSON.parse(payment.customerData || "{}");

    // Get product to determine delivery type
    const product = await db.query.products.findFirst({
      where: eq(products.id, payment.productId),
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Handle different product categories
    if (product.category === "copy_trading" || product.category === "connector") {
      // Generate EA
      await generateAndDeliverEA(payment, product, customerData);
    } else {
      // For other products, just mark as delivered
      await db.update(payments)
        .set({
          delivered: true,
          deliveredAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
    }

    console.log(`[Checkout] Delivery processed for order: ${payment.orderId}`);
  } catch (error: any) {
    console.error("[Checkout] Delivery error:", error);
    // TODO: Send alert to admin
  }
}

/**
 * Generate and deliver EA
 */
async function generateAndDeliverEA(payment: any, product: any, customerData: any) {
  const db = getDb();
  
  const { accountNumber, eaType, platform, duration } = customerData;
  
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + (duration || 30));

  // Create EA order
  const [eaOrder] = await db.insert(eaOrders).values({
    paymentId: payment.id,
    orderId: payment.orderId,
    eaType,
    platform,
    accountNumber,
    expiryDate,
  });

  try {
    // Generate EA source code
    const sourceCode = await generateEACode({
      accountNumber,
      expiryDate,
      eaType,
      platform,
    });

    // Save source code
    const sourcePath = await saveEACode(sourceCode, {
      accountNumber,
      expiryDate,
      eaType,
      platform,
    });

    // Compile EA (simulated for now)
    const compiledPath = await compileEA(sourcePath, platform);

    // Update EA order with generated files
    await db.update(eaOrders)
      .set({
        sourceCode,
        compiledFile: compiledPath,
        generated: true,
        generatedAt: new Date(),
        compiled: true,
        compiledAt: new Date(),
      })
      .where(eq(eaOrders.id, eaOrder.insertId));

    // Send email with EA
    console.log(`[EA Generated] Account: ${accountNumber}, Path: ${compiledPath}`);
    //     await sendEADeliveryEmail({
    //       to: payment.customerEmail,
    //       eaName: product.name,
    //       accountNumber,
    //       expiryDate,
    //       attachmentPath: compiledPath,
    //     });

    // Mark as delivered
    await db.update(payments)
      .set({
        delivered: true,
        deliveredAt: new Date(),
        deliveryData: JSON.stringify({
          eaOrderId: eaOrder.insertId,
          accountNumber,
          eaType,
          platform,
          expiryDate: expiryDate.toISOString(),
          compiledFile: compiledPath,
        }),
      })
      .where(eq(payments.id, payment.id));

    console.log(`[Checkout] EA generated and delivered: ${payment.orderId}`);
  } catch (error: any) {
    console.error("[Checkout] Error generating EA:", error);
    // TODO: Send alert to admin
    throw error;
  }
}

export default router;

