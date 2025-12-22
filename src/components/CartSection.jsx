import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QuantityControl from '../helper/QuantityControl';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

const CartSection = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [buyingId, setBuyingId] = useState(null);

  const authHeaders = () => {
    const token = localStorage.getItem('userToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

const normalizeCartItems = (raw = []) => {
  return raw
    .map((cartEntry) => {
      // The product details are nested under cartEntry.product
      const product = cartEntry.product || {};

      // Use the productId from the cart entry level if needed as fallback
      const id = product?.id || cartEntry.productId || '';

      return {
        id,
        name: product?.name?.trim() || 'Product',
        price: Number(product?.price || 0),
        quantity: Number(cartEntry.quantity || 1),
        image:
          (product?.images && product.images.length > 0 && product.images[0]) ||
          '/images/no-image.svg',
      };
    })
    .filter((p) => p.id); // Remove any entries without a valid id
};

const fetchCart = async () => {
  if (!localStorage.getItem('userToken')) {
    setItems([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const res = await axios.get(API_ENDPOINTS.CART, {
      headers: authHeaders(),
    });

    const payload = res.data;
    console.log("API payload:", payload);

    // The actual items are inside payload.cart (an array of cart entries)
    const list = Array.isArray(payload?.cart) ? payload.cart : [];

    const normalizedItems = normalizeCartItems(list);
    setItems(normalizedItems);

    console.log("Normalized cart items:", normalizedItems);
  } catch (err) {
    console.error('Cart fetch failed', err);
    setError('Failed to load cart. Please try again.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (productId, showToast = true) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/account');
      return;
    }
    try {
      await axios.delete(API_ENDPOINTS.CART, {
        headers: authHeaders(),
        data: { productId },
      });
      if (showToast) toast.success('Removed from cart');
      window.dispatchEvent(new Event('cartUpdated'));
      fetchCart();
    } catch (err) {
      console.error('Remove from cart failed', err);
      toast.error(err?.response?.data?.message || 'Failed to remove item');
    }
  };

  const handleQuantityChange = async (productId, quantity) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/account');
      return;
    }
    setUpdatingId(productId);
    try {
      await axios.post(
        API_ENDPOINTS.CART,
        { productId, quantity },
        { headers: authHeaders() }
      );
      window.dispatchEvent(new Event('cartUpdated'));
      fetchCart();
    } catch (err) {
      console.error('Update cart failed', err);
      toast.error(err?.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBuyNow = async (item) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/account');
      return;
    }
    setBuyingId(item.id);
    try {
      await axios.post(
        API_ENDPOINTS.ORDERS_CREATE,
        {
          productId: item.id,
          amount: item.price * item.quantity,
          token: 'USD',
          paid: false,
          orderId: `cart-${Date.now()}`,
        },
        { headers: authHeaders() }
      );
      toast.success('Order placed from cart');
      await handleRemove(item.id, false);
    } catch (err) {
      console.error('Buy now failed', err);
      toast.error(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setBuyingId(null);
    }
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  if (loading) {
    return (
      <section className="cart py-80">
        <div className="container container-lg">
          <div className="text-center text-gray-600">Loading your cart...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="cart py-80">
        <div className="container container-lg">
          <div className="alert alert-danger text-center">{error}</div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="cart py-80">
        <div className="container container-lg text-center">
          <h5 className="mb-12">Your cart is empty</h5>
          <Link
            to="/"
            className="btn bg-main-600 text-white rounded-pill px-24 py-12"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart py-80">
      <div className="container container-lg">
        <div className="row gy-4">
          <div className="col-xl-9 col-lg-8">
            <div className="cart-table border border-gray-100 rounded-8 px-24 py-32">
              <div className="overflow-x-auto scroll-sm scroll-sm-horizontal">
                <table className="table style-three">
                  <thead>
                    <tr>
                      <th className="h6 mb-0 text-lg fw-bold">Delete</th>
                      <th className="h6 mb-0 text-lg fw-bold">Product Name</th>
                      <th className="h6 mb-0 text-lg fw-bold">Price</th>
                      <th className="h6 mb-0 text-lg fw-bold">Quantity</th>
                      <th className="h6 mb-0 text-lg fw-bold">Subtotal</th>
                      <th className="h6 mb-0 text-lg fw-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="remove-tr-btn flex-align gap-12 hover-text-danger-600"
                            disabled={updatingId === item.id || buyingId === item.id}
                          >
                            <i className="ph ph-x-circle text-2xl d-flex" />
                            Remove
                          </button>
                        </td>
                        <td>
                          <div className="table-product d-flex align-items-center gap-16">
                            <Link
                              to={`/product-details/${item.id}`}
                              className="table-product__thumb border border-gray-100 rounded-8 flex-center "
                            >
                              <img
                                src={item.image || '/images/no-image.svg'}
                                alt={item.name}
                                onError={(e) => {
                                  e.target.src = '/images/no-image.svg';
                                }}
                              />
                            </Link>
                            <div className="table-product__content text-start">
                              <h6 className="title text-lg fw-semibold mb-8">
                                <Link
                                  to={`/product-details/${item.id}`}
                                  className="link text-line-2"
                                  tabIndex={0}
                                >
                                  {item.name}
                                </Link>
                              </h6>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-lg h6 mb-0 fw-semibold">
                            ${item.price.toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <QuantityControl
                            initialQuantity={item.quantity}
                            onChange={(qty) => handleQuantityChange(item.id, qty)}
                            disabled={updatingId === item.id || buyingId === item.id}
                          />
                        </td>
                        <td>
                          <span className="text-lg h6 mb-0 fw-semibold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleBuyNow(item)}
                            disabled={buyingId === item.id}
                            className="btn bg-main-600 text-white rounded-pill px-16 py-10"
                          >
                            {buyingId === item.id ? 'Processing...' : 'Buy Now'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-lg-4">
            <div className="cart__total border border-gray-100 rounded-8 p-24">
              <h6 className="text-xl mb-24">Cart Total</h6>
              <div className="d-flex justify-content-between text-lg text-heading fw-semibold mb-16">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between text-lg text-heading fw-semibold mb-16">
                <span>Shipping</span>
                <span className="text-sm text-neutral-500 fw-normal">
                  Calculated at checkout
                </span>
              </div>
              <div className="d-flex justify-content-between text-lg text-heading fw-semibold">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-24">
                <Link to="/purchased-products" className="btn btn-main w-100 py-3">
                  View Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartSection;

