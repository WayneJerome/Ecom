import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyWebhookSignature } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    // Verify webhook signature
    if (process.env.PAYSTACK_WEBHOOK_SECRET && process.env.PAYSTACK_WEBHOOK_SECRET !== 'YOUR_WEBHOOK_SECRET_HERE') {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, status, amount, customer } = event.data;

      if (status === 'success') {
        // Find and update the order
        const { data: order } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('paystack_ref', reference)
          .single();

        if (order) {
          // Update order status to confirmed
          await supabaseAdmin
            .from('orders')
            .update({
              status: 'confirmed',
              mpesa_ref: event.data.authorization?.authorization_code || reference,
            })
            .eq('id', order.id);

          // Create order tracking entry
          await supabaseAdmin
            .from('order_tracking')
            .insert({
              order_id: order.id,
              status: 'confirmed',
              note: `Payment confirmed via M-Pesa. Amount: KES ${(amount / 100).toFixed(0)}`,
            });

          // Create notification for customer
          if (customer?.email) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('email', customer.email)
              .single();

            if (profile) {
              await supabaseAdmin
                .from('notifications')
                .insert({
                  user_id: profile.id,
                  title: 'Payment Confirmed ✅',
                  body: `Your payment of KES ${(amount / 100).toFixed(0)} has been received. We're preparing your order!`,
                  type: 'order',
                  action_url: `/orders/${order.id}`,
                });
            }
          }

          // Create broadcast notification for admin
          await supabaseAdmin
            .from('notifications')
            .insert({
              user_id: null,
              title: '🛒 New Order Received',
              body: `Order ${reference} — KES ${(amount / 100).toFixed(0)} confirmed`,
              type: 'order',
              action_url: `/admin/orders`,
            });
        }
      }
    }

    // Handle transfer.success (rider payout)
    if (event.event === 'transfer.success') {
      const { reference } = event.data;
      
      await supabaseAdmin
        .from('rider_earnings')
        .update({
          payout_status: 'paid',
          paid_at: new Date().toISOString(),
          mpesa_ref: reference,
        })
        .eq('mpesa_ref', reference);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
