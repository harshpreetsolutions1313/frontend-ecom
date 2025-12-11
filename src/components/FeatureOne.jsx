import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const FeatureOne = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const res = await axios.get(API_ENDPOINTS.CATEGORIES_DETAILS);
                const data = Array.isArray(res.data) ? res.data : [];

                // Deduplicate categories case-insensitively and aggregate counts
                const map = new Map();
                data.forEach(item => {
                    const key = (item.category || '').toLowerCase().trim();
                    if (!key) return;
                    if (!map.has(key)) {
                        map.set(key, { category: item.category, imageUrl: item.imageUrl, count: item.count || 0 });
                    } else {
                        const cur = map.get(key);
                        cur.count = (cur.count || 0) + (item.count || 0);
                        // keep first image if existing
                        if (!cur.imageUrl && item.imageUrl) cur.imageUrl = item.imageUrl;
                        map.set(key, cur);
                    }
                });

                if (mounted) setCategories(Array.from(map.values()));
            } catch (e) {
                console.error('Failed to fetch categories', e);
                if (mounted) setCategories([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchCategories();
        return () => { mounted = false; };
    }, []);

    function SampleNextArrow(props) {
        const { className, onClick } = props;
        return (
            <button
                type="button" onClick={onClick}
                className={` ${className} slick-next slick-arrow flex-center rounded-circle bg-white text-xl hover-bg-main-600 hover-text-white transition-1`}
            >
                <i className="ph ph-caret-right" />
            </button>
        );
    }
    function SamplePrevArrow(props) {
        const { className, onClick } = props;

        return (

            <button
                type="button"
                onClick={onClick}
                className={`${className} slick-prev slick-arrow flex-center rounded-circle bg-white text-xl hover-bg-main-600 hover-text-white transition-1`}
            >
                <i className="ph ph-caret-left" />
            </button>
        );
    }
    const settings = {
        dots: false,
        arrows: true,
        infinite: true,
        speed: 1000,
        slidesToShow: 10,
        slidesToScroll: 1,
        initialSlide: 0,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
        responsive: [
            {
                breakpoint: 1699,
                settings: {
                    slidesToShow: 9,
                },
            },
            {
                breakpoint: 1599,
                settings: {
                    slidesToShow: 8,
                },
            },
            {
                breakpoint: 1399,
                settings: {
                    slidesToShow: 6,
                },
            },
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 5,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 4,
                },
            },
            {
                breakpoint: 575,
                settings: {
                    slidesToShow: 3,
                },
            },
            {
                breakpoint: 424,
                settings: {
                    slidesToShow: 2,
                },
            },
            {
                breakpoint: 359,
                settings: {
                    slidesToShow: 1,
                },
            },

        ],
    };

    const circleStyle = {
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: '0 6px 18px rgba(16,24,40,0.06)',
        border: '1px solid rgba(15,23,42,0.04)'
    };

    const smallCircleStyle = {
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: '0 6px 18px rgba(16,24,40,0.04)',
        border: '1px solid rgba(15,23,42,0.04)'
    };

    return (
        <div className="feature" id="featureSection">
            <div className="container container-lg">
                <div className="position-relative arrow-center">
                    <div className="flex-align">
                        <button
                            type="button"
                            id="feature-item-wrapper-prev"
                            className="slick-prev slick-arrow flex-center rounded-circle bg-white text-xl hover-bg-main-600 hover-text-white transition-1"
                        >
                            <i className="ph ph-caret-left" />
                        </button>

                        <button
                            type="button"
                            id="feature-item-wrapper-next"
                            className="slick-next slick-arrow flex-center rounded-circle bg-white text-xl hover-bg-main-600 hover-text-white transition-1"
                        >
                            <i className="ph ph-caret-right" />
                        </button>
                    </div>

                    <div className="feature-item-wrapper">
                        <Slider {...settings}>
                            {loading ? (
                                <div className="feature-item text-center">
                                    <div className="feature-item__thumb">
                                        <Link to="/shop" className="w-100 h-100 flex-center">
                                            <div style={smallCircleStyle}>
                                                <img src="assets/images/thumbs/feature-img1.png" alt="loading" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="feature-item__content mt-16">
                                        <h6 className="text-lg mb-8">
                                            <Link to="/shop" className="text-inherit">Loading</Link>
                                        </h6>
                                        <span className="text-sm text-gray-400">Please wait</span>
                                    </div>
                                </div>
                            ) : (
                                categories.map((cat, idx) => (
                                    <div className="feature-item text-center" key={cat.category + idx}>
                                        <div className="feature-item__thumb">
                                            <Link to={`/shop?category=${encodeURIComponent(cat.category)}`} className="w-100 h-100 flex-center">
                                                <div 
                                                style={circleStyle}
                                                >
                                                    <img src={cat.imageUrl || '/images/no-image.svg'} alt={cat.category} onError={(e) => e.target.src = '/images/no-image.svg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            </Link>
                                        </div>
                                        <div className="feature-item__content mt-16">
                                            <h6 className="text-lg mb-8">
                                                <Link to={`/shop?category=${encodeURIComponent(cat.category)}`} className="text-inherit">
                                                    {cat.category}
                                                </Link>
                                            </h6>
                                            <span className="text-sm text-gray-400">{(cat.count || 0)} Products</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </Slider>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FeatureOne