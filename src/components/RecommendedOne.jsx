import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ethers } from 'ethers';
import toast from 'react-hot-toast'; // Optional: for nice notifications


import {
    CONTRACT_ABI,
    ERC20_ABI,
    CONTRACT_ADDRESS,
    USDT_ADDRESS,
    USDC_ADDRESS,
} from '../abi/ecommercePaymentAbi';

const RecommendedOne = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedToken, setSelectedToken] = useState('USDT'); // USDT or USDC
    const [buyingProductId, setBuyingProductId] = useState(null);

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

    // Web3 Buy Function
    const handleBuyNow = async (product) => {
        if (!window.ethereum) {
            toast.error("Please install MetaMask!");
            return;
        }

        setBuyingProductId(product._id);
        let provider, signer, contract, tokenContract;

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();

            if (!CONTRACT_ADDRESS) {
                toast.error('Contract address not configured. Set REACT_APP_CONTRACT_ADDRESS');
                return;
            }

            const tokenAddress = selectedToken === 'USDT' ? USDT_ADDRESS : USDC_ADDRESS;
            if (!tokenAddress) {
                toast.error(`Token address for ${selectedToken} not configured.`);
                return;
            }

            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

            // Read the contract's configured token addresses and validate
            let contractUsdt = '';
            let contractUsdc = '';
            try {
                contractUsdt = (await contract.usdtToken())?.toString?.() || '';
                contractUsdc = (await contract.usdcToken())?.toString?.() || '';
            } catch (e) {
                // If the deployed contract doesn't expose these, we'll continue — but warn
                console.warn('Could not read contract token addresses', e);
            }

            if (contractUsdt || contractUsdc) {
                const t = tokenAddress.toLowerCase();
                const u = (contractUsdt || '').toLowerCase();
                const c = (contractUsdc || '').toLowerCase();
                if (t !== u && t !== c) {
                    toast.error(
                        `Selected token is not accepted by contract. Contract accepts USDT=${contractUsdt} USDC=${contractUsdc}`
                    );
                    return;
                }
            }

            // Try to fetch token decimals, fallback to 6
            let decimals = 6;
            try {
                const d = await tokenContract.decimals();
                decimals = Number(d?.toString?.() ?? d) || 6;
            } catch (e) {
                // keep default
            }

            const amount = ethers.parseUnits(product.price.toString(), decimals);

            // Step 1: Approve
            toast.loading('Approving token spending...', { id: 'approve' });
            const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amount);
            await approveTx.wait();
            toast.success('Approved!', { id: 'approve' });

            // Step 2: Create & Pay Order
            toast.loading('Processing payment...', { id: 'payment' });
            const tx = await contract.createAndPayForOrder(product._id.toString(), amount, tokenAddress);
            const receipt = await tx.wait();

            toast.success('Purchase Successful!', { id: 'payment' });
            toast.success(
                <div>
                    Payment Complete!{' '}
                    <a href={`https://sepolia.etherscan.io/tx/${receipt.hash}`} target="_blank" rel="noreferrer">
                        View on Explorer
                    </a>
                </div>
            );

        } catch (err) {
            console.error(err);
            const message = err?.reason || err?.message || 'Transaction failed';
            toast.error((message && message.toString().toLowerCase().includes('user rejected')) ? 'You rejected the transaction' : message);
        } finally {
            setBuyingProductId(null);
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
                {/* Header with Currency Selector */}
                <div className="section-heading flex-between flex-wrap gap-16 align-items-center">
                    <h5 className="mb-0">Recommended for you</h5>

                    <div className="flex-align gap-12">
                        <span className="text-gray-600 fw-medium">Pay with:</span>
                        <div className="btn-group" role="group">
                            <button
                                className={`btn btn-sm ${selectedToken === 'USDT' ? 'btn-main-600 text-white' : 'btn-outline-main-600'}`}
                                onClick={() => setSelectedToken('USDT')}
                            >
                                USDT
                            </button>
                            <button
                                className={`btn btn-sm ${selectedToken === 'USDC' ? 'btn-main-600 text-white' : 'btn-outline-main-600'}`}
                                onClick={() => setSelectedToken('USDC')}
                            >
                                USDC
                            </button>
                        </div>
                    </div>

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
                                    <div key={product._id} className="col-xxl-2 col-lg-3 col-sm-4 col-6">
                                        <div className="product-card h-100 p-8 border border-gray-100 hover-border-main-600 rounded-16 position-relative transition-2">

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
                                                    onError={(e) => e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'}
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
                                                        <span className="text-gray-500 fw-normal"> ({selectedToken})</span>
                                                    </span>
                                                </div>

                                                {/* BUY BUTTON */}
                                                <button
                                                    onClick={() => handleBuyNow(product)}
                                                    disabled={buyingProductId === product._id || product.stock === 0}
                                                    className={`w-100 btn py-11 px-24 rounded-pill flex-align gap-8 justify-content-center transition-2 ${
                                                        buyingProductId === product._id
                                                            ? 'btn-secondary'
                                                            : 'bg-main-600 hover-bg-main-700 text-white'
                                                    }`}
                                                >
                                                    {buyingProductId === product._id ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-8" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Buy Now with {selectedToken} <i className="ph ph-wallet" />
                                                        </>
                                                    )}
                                                </button>

                                                {/* Optional: Keep View Details below */}
                                                <Link
                                                    to={`/product-details/${product._id}`}
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