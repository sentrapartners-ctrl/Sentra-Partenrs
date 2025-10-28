import fs from "fs/promises";
import path from "path";

export interface EAConfig {
  accountNumber: string;
  expiryDate: Date;
  eaType: "copy_master" | "copy_slave" | "connector";
  platform: "MT4" | "MT5";
}

/**
 * Generate MQL4/MQL5 source code with hardcoded account and expiry date
 */
export async function generateEACode(config: EAConfig): Promise<string> {
  const { accountNumber, expiryDate, eaType, platform } = config;
  
  // Read template based on EA type and platform
  const templatePath = getTemplatePath(eaType, platform);
  let template = await fs.readFile(templatePath, "utf-8");
  
  // Replace placeholders
  template = template.replace(/{{ACCOUNT_NUMBER}}/g, accountNumber);
  template = template.replace(/{{EXPIRY_DATE}}/g, formatDateForMQL(expiryDate));
  template = template.replace(/{{EXPIRY_TIMESTAMP}}/g, Math.floor(expiryDate.getTime() / 1000).toString());
  
  return template;
}

/**
 * Get template path based on EA type and platform
 */
function getTemplatePath(eaType: string, platform: string): string {
  const baseDir = path.join(process.cwd(), "EAs_Final");
  
  const templateMap: Record<string, string> = {
    "copy_master_MT4": "SentraPartners_CopyTrading_Master_MT4.mq4",
    "copy_master_MT5": "SentraPartners_CopyTrading_Master_MT5.mq5",
    "copy_slave_MT4": "SentraPartners_CopyTrading_Slave_MT4.mq4",
    "copy_slave_MT5": "SentraPartners_CopyTrading_Slave_MT5.mq5",
    "connector_MT4": "SentraPartners_Connector_MT4.mq4",
    "connector_MT5": "SentraPartners_Connector_MT5.mq5",
  };
  
  const key = `${eaType}_${platform}`;
  const filename = templateMap[key];
  
  if (!filename) {
    throw new Error(`Template not found for ${eaType} ${platform}`);
  }
  
  return path.join(baseDir, filename);
}

/**
 * Format date for MQL (YYYY.MM.DD)
 */
function formatDateForMQL(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

/**
 * Save generated EA code to file
 */
export async function saveEACode(code: string, config: EAConfig): Promise<string> {
  const outputDir = path.join(process.cwd(), "generated_eas");
  await fs.mkdir(outputDir, { recursive: true });
  
  const extension = config.platform === "MT4" ? "mq4" : "mq5";
  const filename = `SentraPartners_${config.eaType}_${config.accountNumber}_${Date.now()}.${extension}`;
  const filepath = path.join(outputDir, filename);
  
  await fs.writeFile(filepath, code, "utf-8");
  
  return filepath;
}

/**
 * Compile EA using Wine + MetaEditor
 * Note: This requires Wine and MetaEditor to be installed on the server
 */
export async function compileEA(sourcePath: string, platform: string): Promise<string> {
  // TODO: Implement compilation using Wine + MetaEditor
  // For now, return the source path as a placeholder
  
  // const { exec } = require("child_process");
  // const util = require("util");
  // const execPromise = util.promisify(exec);
  
  // const metaeditorPath = platform === "MT4" 
  //   ? "/path/to/metaeditor.exe" 
  //   : "/path/to/metaeditor64.exe";
  
  // const command = `wine ${metaeditorPath} /compile:"${sourcePath}"`;
  // await execPromise(command);
  
  // Return compiled file path
  const compiledPath = sourcePath.replace(/\.mq[45]$/, platform === "MT4" ? ".ex4" : ".ex5");
  
  console.log(`[EA Generator] Compilation simulated: ${compiledPath}`);
  
  return compiledPath;
}

