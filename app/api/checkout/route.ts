import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { initiateMpesaSTKPush } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items, customer, delivery_address,
      subtotal, delivery_fee, total,
      reference, payment_method,
    } = body;

    if (!items?.length || !customer?.email || !customer?.phone || !reference) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Create order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_email: customer.email,
        customer_phone: customer.phone,
        items,
        subtotal,
        delivery_fee,
        total,
        status: 'pending',
        paystack_ref: reference,
        delivery_address,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
    }

    // Initiate M-Pesa STK Push via Paystack
    if (payment_method === 'mpesa') {
      try {
        const nameParts = (customer.full_name || 'Customer').split(' ');
        const stkResponse = await initiateMpesaSTKPush({
          email: customer.email,
          amount: total,
          reference,
          phone: customer.phone,
          first_name: nameParts[0] || 'Customer',
          last_name: nameParts.slice(1).join(' ') || '',
          metadata: {
            order_id: order.id,
            items_count: items.length,
          },
        });

        // Update order with mpesa reference
        if (stkResponse.data?.reference) {
          await supabaseAdmin
            .from('orders')
            .update({ mpesa_ref: stkResponse.data.reference })
            .eq('id', order.id);
        }

        return NextResponse.json({
          success: true,
          order_id: order.id,
          reference,
          stk_response: stkResponse,
        });
      } catch (stkError) {
        console.error('STK Push error:', stkError);
        // Order is created, just payment initiation failed
        return NextResponse.json({
          success: true,
          order_id: order.id,
          reference,
          payment_pending: true,
          stk_error: 'STK Push initiation failed. Please retry.',
        });
      }
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      reference,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
