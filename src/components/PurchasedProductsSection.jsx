import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PurchasedProductsSection = () => {
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPurchasedProducts = async () => {
    const jwtToken = localStorage.getItem('userToken');
    
    if (!jwtToken) {
      setError('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users/purchased-products', {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch purchased products');
      }

      const data = await response.json();
      // Accessing the 'products' array from your API response structure
      setPurchasedItems(data.products || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasedProducts();
  }, []);

  if (loading) {
    return <section className='cart py-80'><div className="container container-lg">Loading your orders...</div></section>;
  }

  if (error) {
    return <section className='cart py-80'><div className="container container-lg">Error: {error}</div></section>;
  }

  if (purchasedItems.length === 0) {
    return <section className='cart py-80'><div className="container container-lg">You haven't purchased any products yet.</div></section>;
  }

  return (
    <section className='cart py-80'>
      <div className='container container-lg'>
        <div className='row gy-4'>
          <div className='col-lg-12'>
            <div className='cart-table border border-gray-100 rounded-8'>
              <div className='overflow-x-auto scroll-sm scroll-sm-horizontal'>
                <table className='table rounded-8 overflow-hidden'>
                  <thead>
                    <tr className='border-bottom border-neutral-100'>
                      <th className='h6 mb-0 text-lg fw-bold px-40 py-32 border-end border-neutral-100'> Order ID </th>
                      <th className='h6 mb-0 text-lg fw-bold px-40 py-32 border-end border-neutral-100'> Product </th>
                      <th className='h6 mb-0 text-lg fw-bold px-40 py-32 border-end border-neutral-100'> Amount Paid </th>
                      <th className='h6 mb-0 text-lg fw-bold px-40 py-32 border-end border-neutral-100'> Purchase Date </th>
                      <th className='h6 mb-0 text-lg fw-bold px-40 py-32'> Action </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchasedItems.map((item, index) => (
                      <tr key={index}>
                        <td className='px-40 py-32 border-end border-neutral-100'>
                          <span className='text-lg h6 mb-0 fw-semibold'>#{item.orderId}</span>
                        </td>
                        <td className='px-40 py-32 border-end border-neutral-100'>
                          <div className='table-product d-flex align-items-center gap-24'>
                            <Link to={`/product-details/${item.productId}`} className='table-product__thumb border border-gray-100 rounded-8 flex-center'>
                              <img src={item.productImages[0]} alt={item.productName} />
                            </Link>
                            <div className='table-product__content text-start'>
                              <h6 className='title text-lg fw-semibold mb-8'>
                                <Link to={`/product-details/${item.productId}`} className='link text-line-2'>
                                  {item.productName}
                                </Link>
                              </h6>
                              <span className="text-xs text-neutral-500 uppercase">ID: {item.productId}</span>
                            </div>
                          </div>
                        </td>
                        <td className='px-40 py-32 border-end border-neutral-100'>
                          <span className='text-lg h6 mb-0 fw-semibold'>
                            {item.amount} {item.token}
                          </span>
                        </td>
                        <td className='px-40 py-32 border-end border-neutral-100'>
                          <span className='text-lg h6 mb-0 fw-semibold'>
                            {new Date(item.trackedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className='px-40 py-32'>
                          <Link 
                            to={`/product-details/${item.productId}`} 
                            className='btn btn-main-two rounded-8 px-32 py-12 text-sm'
                          >
                            View Product <i className='ph ph-arrow-right' />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PurchasedProductsSection;
