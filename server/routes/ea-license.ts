import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { eaLicenses, eaLicenseUsageLogs } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

/**
 * POST /api/ea-license/validate
 * Valida licença de um EA
 */
router.post("/validate", async (req: Request, res: Response) => {
  try {
    console.log("[EA License] ===== VALIDATION REQUEST =====");
    console.log("[EA License] Body:", JSON.stringify(req.body, null, 2));
    
    const { accountNumber, eaType, terminalInfo } = req.body;
    
    if (!accountNumber || !eaType) {
      return res.status(400).json({ 
        valid: false,
        error: "Missing required fields: accountNumber and eaType" 
      });
    }
    
    if (!["master", "slave"].includes(eaType)) {
      return res.status(400).json({ 
        valid: false,
        error: "Invalid eaType. Must be 'master' or 'slave'" 
      });
    }
    
    const db = await getDb();
    if (!db) {
      console.error("[EA License] Database not available");
      return res.status(500).json({ 
        valid: false,
        error: "Database not available" 
      });
    }
    
    // Buscar licença ativa para esta conta
    const licenses = await db
      .select()
      .from(eaLicenses)
      .where(
        and(
          eq(eaLicenses.accountNumber, accountNumber.toString()),
          eq(eaLicenses.isActive, true)
        )
      )
      .limit(1);
    
    if (licenses.length === 0) {
      console.log(`[EA License] No license found for account ${accountNumber}`);
      
      // Registrar tentativa de validação falha
      await db.insert(eaLicenseUsageLogs).values({
        licenseId: 0,
        accountNumber: accountNumber.toString(),
        eaType: eaType as "master" | "slave",
        validationResult: "invalid",
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string || "unknown",
        terminalInfo: terminalInfo ? JSON.stringify(terminalInfo) : null,
      });
      
      return res.json({ 
        valid: false,
        error: "No active license found for this account",
        message: "Please contact support to activate your license"
      });
    }
    
    const license = licenses[0];
    
    // Verificar se o tipo de EA está permitido
    if (license.eaType !== "both" && license.eaType !== eaType) {
      console.log(`[EA License] EA type ${eaType} not allowed for account ${accountNumber}`);
      
      await db.insert(eaLicenseUsageLogs).values({
        licenseId: license.id,
        accountNumber: accountNumber.toString(),
        eaType: eaType as "master" | "slave",
        validationResult: "invalid",
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string || "unknown",
        terminalInfo: terminalInfo ? JSON.stringify(terminalInfo) : null,
      });
      
      return res.json({ 
        valid: false,
        error: `This license is only valid for ${license.eaType} EA`,
        message: "Please use the correct EA type or upgrade your license"
      });
    }
    
    // Verificar data de expiração
    const now = new Date();
    const expiryDate = new Date(license.expiryDate);
    
    if (expiryDate < now) {
      console.log(`[EA License] License expired for account ${accountNumber}`);
      
      await db.insert(eaLicenseUsageLogs).values({
        licenseId: license.id,
        accountNumber: accountNumber.toString(),
        eaType: eaType as "master" | "slave",
        validationResult: "expired",
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string || "unknown",
        terminalInfo: terminalInfo ? JSON.stringify(terminalInfo) : null,
      });
      
      return res.json({ 
        valid: false,
        error: "License expired",
        expiryDate: expiryDate.toISOString(),
        message: "Please renew your license to continue using the EA"
      });
    }
    
    // Licença válida!
    console.log(`[EA License] License valid for account ${accountNumber} until ${expiryDate}`);
    
    // Atualizar último uso
    await db
      .update(eaLicenses)
      .set({ lastUsedAt: now })
      .where(eq(eaLicenses.id, license.id));
    
    // Registrar validação bem-sucedida
    await db.insert(eaLicenseUsageLogs).values({
      licenseId: license.id,
      accountNumber: accountNumber.toString(),
      eaType: eaType as "master" | "slave",
      validationResult: "success",
      ipAddress: req.ip || req.headers['x-forwarded-for'] as string || "unknown",
      terminalInfo: terminalInfo ? JSON.stringify(terminalInfo) : null,
    });
    
    // Calcular dias restantes
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    res.json({ 
      valid: true,
      expiryDate: expiryDate.toISOString(),
      daysRemaining,
      eaType: license.eaType,
      maxSlaves: license.maxSlaves,
      message: `License valid until ${expiryDate.toLocaleDateString()}`
    });
    
  } catch (error) {
    console.error("[EA License] Validation error:", error);
    res.status(500).json({ 
      valid: false,
      error: "Internal server error" 
    });
  }
});

/**
 * GET /api/ea-license/check/:accountNumber
 * Verifica status de licença (endpoint simplificado para MT4/MT5)
 */
router.get("/check/:accountNumber", async (req: Request, res: Response) => {
  try {
    const { accountNumber } = req.params;
    const { eaType } = req.query;
    
    if (!accountNumber) {
      return res.status(400).json({ valid: false, error: "Missing accountNumber" });
    }
    
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ valid: false, error: "Database not available" });
    }
    
    const licenses = await db
      .select()
      .from(eaLicenses)
      .where(
        and(
          eq(eaLicenses.accountNumber, accountNumber),
          eq(eaLicenses.isActive, true)
        )
      )
      .limit(1);
    
    if (licenses.length === 0) {
      return res.json({ valid: false });
    }
    
    const license = licenses[0];
    const now = new Date();
    const expiryDate = new Date(license.expiryDate);
    
    if (expiryDate < now) {
      return res.json({ valid: false, expired: true });
    }
    
    // Verificar tipo de EA se fornecido
    if (eaType && license.eaType !== "both" && license.eaType !== eaType) {
      return res.json({ valid: false, wrongType: true });
    }
    
    res.json({ 
      valid: true,
      expiryDate: expiryDate.toISOString()
    });
    
  } catch (error) {
    console.error("[EA License] Check error:", error);
    res.status(500).json({ valid: false, error: "Internal server error" });
  }
});

export default router;

