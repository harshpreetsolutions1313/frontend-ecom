import React, { useEffect, useState } from 'react';

/**
 * Quantity control with optional change callback.
 * If onChange is provided, it will be called whenever the value changes.
 */
const QuantityControl = ({ initialQuantity = 1, min = 1, max, onChange, disabled = false }) => {
    const [quantity, setQuantity] = useState(initialQuantity);

    useEffect(() => {
        setQuantity(initialQuantity);
    }, [initialQuantity]);

    const updateQuantity = (next) => {
        const nextValue = Math.max(min, max ? Math.min(next, max) : next);
        setQuantity(nextValue);
        if (onChange) onChange(nextValue);
    };

    const incrementQuantity = () => updateQuantity(quantity + 1);
    const decrementQuantity = () => updateQuantity(quantity > min ? quantity - 1 : min);

    return (
        <div className="d-flex rounded-4 overflow-hidden">
            <button
                type="button"
                onClick={decrementQuantity}
                disabled={disabled || quantity <= min}
                className="quantity__minus border border-end border-gray-100 flex-shrink-0 h-48 w-48 text-neutral-600 flex-center hover-bg-main-600 hover-text-white disabled:opacity-75"
            >
                <i className="ph ph-minus" />
            </button>
            <input
                type="number"
                className="quantity__input flex-grow-1 border border-gray-100 border-start-0 border-end-0 text-center w-32 px-4"
                value={quantity}
                min={min}
                readOnly
            />
            <button
                type="button"
                onClick={incrementQuantity}
                disabled={disabled || (max ? quantity >= max : false)}
                className="quantity__plus border border-end border-gray-100 flex-shrink-0 h-48 w-48 text-neutral-600 flex-center hover-bg-main-600 hover-text-white disabled:opacity-75"
            >
                <i className="ph ph-plus" />
            </button>
        </div>
    );
};

export default QuantityControl;
