import Stripe from 'stripe';
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',  // Updated to latest version
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, tempSessionId } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: 'Email is required' 
      });
    }

    // Create Stripe checkout session with minimal data
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
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&sid=${tempSessionId || ''}`,
      cancel_url: `${req.headers.origin}/studio`,
      customer_email: email,
      metadata: {
        sessionId: tempSessionId || uuidv4() // Use provided tempSessionId or generate new one
      },
    });

    return res.status(200).json({ sessionId: session.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      message: 'Error creating checkout session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 