import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Auth from './components/Auth';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import SuccessPage from './components/SuccessPage';
import OrderHistory from './components/OrderHistory';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar onSearchChange={setSearchQuery} searchQuery={searchQuery} />
            <Routes>
              <Route path="/" element={<Home searchQuery={searchQuery} />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/orders" element={<OrderHistory />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;