import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { plan, tenantId } = await req.json();

    if (!plan || !tenantId) {
      return NextResponse.json({ error: 'Missing plan or tenantId' }, { status: 400 });
    }

    // Amount in paise (INR × 100)
    const amount = plan === 'annual' ? 9999 * 100 : 999 * 100;

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      notes: {
        tenantId,
        plan,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Razorpay create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
