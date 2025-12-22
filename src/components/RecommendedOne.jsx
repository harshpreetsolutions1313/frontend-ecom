import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_ENDPOINTS } from '../config/api';

const RecommendedOne = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [addingProductId, setAddingProductId] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await axios.get(API_ENDPOINTS.PRODUCTS);
                setProducts(response.data || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products. Please check if the server is running.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const getFilteredProducts = () => {
        if (activeTab === 'all') return products;

        return products.filter(product => {
            const category = product.category?.toLowerCase() || '';
            switch (activeTab) {
                case 'grocery':
                    return ['dairy', 'grocery', 'food', 'snack', 'bread', 'cereal'].some(term => category.includes(term));
                case 'fruits':
                    return category.includes('fruit');
                case 'juices':
                    return category.includes('juice') || category.includes('beverage') || category.includes('drink');
                case 'vegetables':
                    return category.includes('vegetable') || category.includes('veggie');
                case 'snacks':
                    return category.includes('snack') || category.includes('chips') || category.includes('nuts');
                case 'organic':
                    return category.includes('organic') || category.includes('natural');
                default:
                    return true;
            }
        });
    };

    const filteredProducts = getFilteredProducts();

    const handleAddToCart = async (product) => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            toast.error('Please log in to add items to your cart.');
            navigate('/account');
            return;
        }
        setAddingProductId(product.id);
        try {
            await axios.post(API_ENDPOINTS.CART, {
                productId: product.id,
                quantity: 1,
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Added to cart');
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (err) {
            console.error('Add to cart failed', err);
            const message = err?.response?.data?.message || err?.message || 'Failed to add to cart';
            toast.error(message);
        } finally {
            setAddingProductId(null);
        }
    };

    if (loading) {
        return (
            <section className="recommended py-80">
                <div className="container container-lg">
                    <div className="text-center">
                        <div className="spinner-border text-main-600" style={{ width: '3rem', height: '3rem' }} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-16 text-gray-600">Loading products...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="recommended py-80">
                <div className="container container-lg">
                    <div className="alert alert-danger text-center" role="alert">
                        <strong>Oops!</strong> {error}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="recommended">
            <div className="container container-lg">
                <div className="section-heading flex-between flex-wrap gap-16 align-items-center">
                    <h5 className="mb-0">Recommended for you</h5>

                    {/* Tabs */}
                    <ul className="nav common-tab nav-pills" id="pills-tab" role="tablist">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'grocery', label: 'Grocery' },
                            { key: 'fruits', label: 'Fruits' },
                            { key: 'juices', label: 'Juices' },
                            { key: 'vegetables', label: 'Vegetables' },
                            { key: 'snacks', label: 'Snacks' },
                            { key: 'organic', label: 'Organic Foods' },
                        ].map(tab => (
                            <li className="nav-item" role="presentation" key={tab.key}>
                                <button
                                    className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.key)}
                                    type="button"
                                >
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="tab-content mt-24">
                    <div className="tab-pane fade show active">
                        <div className="row g-12">
                            {filteredProducts.length === 0 ? (
                                <div className="col-12 text-center py-5">
                                    <p className="text-gray-500 fs-18">No products found in this category.</p>
                                </div>
                            ) : (
                                filteredProducts.map((product) => (
                                    <div key={product.id} className="col-xxl-2 col-lg-3 col-sm-4 col-6">
                                        <div className="product-card h-100 p-8 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2">

                                            {product.stock === 0 && (
                                                <span className="product-card__badge bg-danger-600 px-8 py-4 text-sm text-white">
                                                    Sold Out
                                                </span>
                                            )}

                                            <Link to={`/product-details/${product.id}`} className="product-card__thumb flex-center rounded-8 overflow-hidden">
                                                <img
                                                    src={product.images[0] || '/images/no-image.svg'}
                                                    alt={product.name}
                                                    className="w-100 h-auto cover-img"
                                                    style={{ objectFit: 'cover', height: '200px' }}
                                                    onError={(e) => e.target.src = '/images/no-image.svg'}
                                                />
                                            </Link>

                                            <div className="product-card__content p-sm-2 mt-16">
                                                <h6 className="title text-lg fw-semibold mb-8">
                                                    <Link to={`/product-details/${product.id}`} className="link text-line-2">
                                                        {product.name}
                                                    </Link>
                                                </h6>

                                                <div className="flex-align gap-4 mb-8">
                                                    <span className="text-main-600 text-md d-flex">
                                                        <i className="ph-fill ph-storefront" />
                                                    </span>
                                                    <span className="text-gray-500 text-xs">
                                                        {product.category || 'General Store'}
                                                    </span>
                                                </div>

                                                <div className="product-card__price mb-12">
                                                    <span className="text-heading text-md fw-semibold">
                                                        ${Number(product.price).toFixed(2)}
                                                    </span>
                                                </div>

                                                {/* ADD TO CART BUTTON */}
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={addingProductId === product.id || product.stock === 0}
                                                    className={`
                                                        w-100 btn py-11 px-24 rounded-pill flex-align gap-8 justify-content-center transition-2 
                                                        ${
                                                        addingProductId === product.id
                                                            ? 'btn-secondary'
                                                            : 'bg-main-600 hover-bg-main-700 text-white'
                                                    }`}
                                                >
                                                    {addingProductId === product.id ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-8" />
                                                            Adding...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Add to Cart <i className="ph ph-shopping-cart" />
                                                        </>
                                                    )}
                                                </button>

                                                {/* Optional: Keep View Details below */}
                                                
                                                <Link
                                                    to={`/product-details/${product.id}`}
                                                    className="d-block text-center mt-8 text-main-600 hover-text-decoration-underline text-sm"
                                                >
                                                    View Details →
                                                </Link>

                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RecommendedOne;