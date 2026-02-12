import Stripe from 'stripe';
import dotenv from 'dotenv'; // Ensure environment variables are loaded if not already

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY is missing from environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-09-30.acacia', // Use a specific API version for stability
  typescript: true,
});
