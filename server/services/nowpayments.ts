import axios from 'axios';

const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY!;

export interface CreatePaymentParams {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  ipn_callback_url?: string;
  order_id: string;
  order_description: string;
  success_url?: string;
  cancel_url?: string;
}

export interface PaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url?: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  invoice_url: string;
}

class NOWPaymentsService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = API_KEY;
    this.apiUrl = NOWPAYMENTS_API_URL;
  }

  private getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get available currencies
   */
  async getAvailableCurrencies(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/currencies`, {
        headers: this.getHeaders(),
      });
      return response.data.currencies;
    } catch (error: any) {
      console.error('[NOWPayments] Error getting currencies:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get estimated price in crypto
   */
  async getEstimatedPrice(amount: number, currency_from: string, currency_to: string): Promise<number> {
    try {
      const response = await axios.get(`${this.apiUrl}/estimate`, {
        headers: this.getHeaders(),
        params: {
          amount,
          currency_from,
          currency_to,
        },
      });
      return response.data.estimated_amount;
    } catch (error: any) {
      console.error('[NOWPayments] Error getting estimate:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create payment
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    try {
      console.log('[NOWPayments] Creating payment:', params);
      
      const response = await axios.post(
        `${this.apiUrl}/payment`,
        params,
        { headers: this.getHeaders() }
      );

      console.log('[NOWPayments] Payment created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[NOWPayments] Error creating payment:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create invoice (hosted payment page)
   */
  async createInvoice(params: CreatePaymentParams): Promise<{ id: string; invoice_url: string }> {
    try {
      console.log('[NOWPayments] Creating invoice:', params);
      
      const response = await axios.post(
        `${this.apiUrl}/invoice`,
        params,
        { headers: this.getHeaders() }
      );

      console.log('[NOWPayments] Invoice created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[NOWPayments] Error creating invoice:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/payment/${paymentId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('[NOWPayments] Error getting payment status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verify IPN callback
   */
  verifyIPN(signature: string, payload: string): boolean {
    const crypto = require('crypto');
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET!;
    
    const hmac = crypto.createHmac('sha512', ipnSecret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');
    
    return calculatedSignature === signature;
  }
}

export const nowPaymentsService = new NOWPaymentsService();

