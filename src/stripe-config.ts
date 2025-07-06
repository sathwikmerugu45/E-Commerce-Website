export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_ScrTVkWfP2gI7B',
    priceId: 'price_1RhbkQR4HjYicDO0tYEGLzl5',
    name: 'Premium E-Commerce Package',
    description: 'Complete e-commerce solution with advanced features, premium support, and unlimited access to all tools.',
    mode: 'payment',
  },
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};