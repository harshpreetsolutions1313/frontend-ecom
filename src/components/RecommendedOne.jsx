import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RecommendedOne = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    // Fetch products from your API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/products');
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

    // Filter products by category (case-insensitive)
    const getFilteredProducts = () => {
        if (activeTab === 'all') return products;

        return products.filter(product => {
            const category = product.category?.toLowerCase() || '';

            switch (activeTab) {
                case 'grocery':
                    return ['dairy', 'grocery', 'food', 'snack', 'bread', 'cereal'].some(term =>
                        category.includes(term)
                    );
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
                <div className="section-heading flex-between flex-wrap gap-16">
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

                {/* Product Grid */}
                <div className="tab-content mt-24">
                    <div className="tab-pane fade show active">
                        <div className="row g-12">
                            {filteredProducts.length === 0 ? (
                                <div className="col-12 text-center py-5">
                                    <p className="text-gray-500 fs-18">No products found in this category.</p>
                                </div>
                            ) : (
                                filteredProducts.map((product) => (
                                    <div key={product._id} className="col-xxl-2 col-lg-3 col-sm-4 col-6">
                                        <div className="product-card h-100 p-8 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2">

                                            {/* Optional Badge (you can add logic later) */}

                                        
                                            {/* {product.stock < 20 && product.stock > 0 && 
                                            
                                            (    
                                                <span className="product-card__badge bg-warning-600 px-8 py-4 text-sm text-white">
                                                    Low Stock
                                                </span>
                                            )
                                            
                                            } */}

                                            {product.stock === 0 && (
                                                <span className="product-card__badge bg-danger-600 px-8 py-4 text-sm text-white">
                                                    Sold Out
                                                </span>
                                            )}

                                            <Link to={`/product-details/${product._id}`} className="product-card__thumb flex-center rounded-8 overflow-hidden">
                                                <img
                                                    src={product.images[0] || 'https://via.placeholder.com/300x300?text=No+Image'}
                                                    alt={product.name}
                                                    className="w-100 h-auto cover-img"
                                                    style={{ objectFit: 'cover', height: '200px' }}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                                                    }}
                                                />
                                            </Link>

                                            <div className="product-card__content p-sm-2 mt-16">
                                                <h6 className="title text-lg fw-semibold mb-8">
                                                    <Link to={`/product-details/${product._id}`} className="link text-line-2">
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
                                                        <span className="text-gray-500 fw-normal"> /Qty</span>
                                                    </span>
                                                </div>

                                                <div className="flex-align gap-6 mb-16">
                                                    <span className="text-xs fw-bold text-gray-600">4.8</span>
                                                    <span className="text-15 fw-bold text-warning-600 d-flex">
                                                        <i className="ph-fill ph-star" />
                                                    </span>
                                                    <span className="text-xs fw-bold text-gray-600">({product.stock}+)</span>
                                                </div>

                                                <Link
                                                    to={`/product-details/${product._id}`}
                                                    className="product-card__cart btn bg-main-50 text-main-600 hover-bg-main-600 hover-text-white py-11 px-24 rounded-pill flex-align gap-8 w-100 justify-content-center transition-2"
                                                >
                                                    View Details <i className="ph ph-arrow-right" />
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