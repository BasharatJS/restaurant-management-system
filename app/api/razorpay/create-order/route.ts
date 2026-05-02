import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Gracefully handle missing keys (dev / build time)
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay keys not configured. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables.' },
        { status: 503 }
      );
    }

    // Lazy import so Razorpay is not instantiated at module load time
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const { plan, tenantId } = await req.json();

    if (!plan || !tenantId) {
      return NextResponse.json({ error: 'Missing plan or tenantId' }, { status: 400 });
    }

    const amount = plan === 'annual' ? 9999 * 100 : 999 * 100;

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      notes: { tenantId, plan },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error: any) {
    console.error('Razorpay create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
