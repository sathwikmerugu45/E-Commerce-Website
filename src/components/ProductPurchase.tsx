import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { stripeProducts, StripeProduct } from '../stripe-config';
import { ShoppingCart, Check } from 'lucide-react';

interface ProductPurchaseProps {
  product?: StripeProduct;
  className?: string;
}

const ProductPurchase: React.FC<ProductPurchaseProps> = ({ 
  product = stripeProducts[0], 
  className = '' 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please sign in to make a purchase');
      return;
    }

    setLoading(true);

    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Failed to authenticate user');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: product.priceId,
          mode: product.mode,
          success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
        {product.description && (
          <p className="text-gray-600 mb-4">{product.description}</p>
        )}
        <div className="text-3xl font-bold text-blue-600 mb-6">
          $0.00
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-center text-gray-700">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span>Instant access</span>
          </div>
          <div className="flex items-center justify-center text-gray-700">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span>Full features included</span>
          </div>
          <div className="flex items-center justify-center text-gray-700">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <span>24/7 support</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={loading || !user}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              <span>{user ? 'Purchase Now' : 'Sign In to Purchase'}</span>
            </>
          )}
        </button>

        {!user && (
          <p className="text-sm text-gray-500 mt-3">
            Please sign in to complete your purchase
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductPurchase;