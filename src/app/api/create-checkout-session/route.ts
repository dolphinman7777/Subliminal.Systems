import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

export async function POST(request: Request) {
  try {
    if (!stripe) {
      throw new Error('Stripe is not properly initialized');
    }

    const { email, tempSessionId } = await request.json();

    if (!email) {
      return NextResponse.json({ 
        message: 'Missing required fields',
        details: 'Email is required' 
      }, { status: 400 });
    }

    // Get origin with fallback
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Subliminal Audio',
            },
            unit_amount: 300,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&sid=${tempSessionId || ''}`,
      cancel_url: `${origin}/studio`,
      customer_email: email,
      metadata: {
        sessionId: tempSessionId || uuidv4()
      },
    });

    if (!session?.id) {
      throw new Error('Failed to create Stripe session');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ 
      message: 'Error creating checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 