/**
 * Paystack API Utilities
 * Handles payment initialization, verification, and M-Pesa STK Push
 */

const PAYSTACK_BASE = 'https://api.paystack.co';
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

async function paystackRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `Paystack API error ${res.status}: ${JSON.stringify(error)}`
    );
  }

  return res.json() as Promise<T>;
}

export interface InitializePaymentInput {
  email: string;
  amount: number; // in kobo/cents (multiply KES by 100)
  reference: string;
  phone?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

export interface PaystackTransaction {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export async function initializePayment(
  input: InitializePaymentInput
): Promise<PaystackTransaction> {
  return paystackRequest<PaystackTransaction>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100), // convert to kobo
      reference: input.reference,
      callback_url: input.callback_url,
      metadata: input.metadata ?? {},
      channels: input.channels ?? ['card', 'mobile_money', 'bank_transfer'],
    }),
  });
}

export interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    status: string; // 'success' | 'failed' | 'abandoned'
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer: { email: string; phone: string };
    metadata: Record<string, unknown>;
  };
}

export async function verifyTransaction(
  reference: string
): Promise<VerifyTransactionResponse> {
  return paystackRequest<VerifyTransactionResponse>(
    `/transaction/verify/${reference}`
  );
}

export interface MpesaStkPushInput {
  email: string;
  amount: number; // KES
  reference: string;
  phone: string; // Format: 254XXXXXXXXX
  first_name: string;
  last_name?: string;
  metadata?: Record<string, unknown>;
}

export interface MpesaStkResponse {
  status: boolean;
  message: string;
  data?: {
    reference: string;
    display_text?: string;
  };
}

export async function initiateMpesaSTKPush(
  input: MpesaStkPushInput
): Promise<MpesaStkResponse> {
  // Normalize phone: ensure starts with 254
  const phone = input.phone
    .replace(/^\+/, '')
    .replace(/^0/, '254');

  return paystackRequest<MpesaStkResponse>('/charge', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      reference: input.reference,
      mobile_money: {
        phone,
        provider: 'mpesa',
      },
      metadata: input.metadata ?? {},
    }),
  });
}

export async function checkChargeStatus(
  reference: string
): Promise<VerifyTransactionResponse> {
  return paystackRequest<VerifyTransactionResponse>(
    `/charge/${reference}`
  );
}

export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  // HMAC SHA512 verification
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  return hash === signature;
}
