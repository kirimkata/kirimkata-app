'use client';

import { useState, useEffect } from 'react';

interface TextLoopProps {
    children: string[];
    interval?: number;
    className?: string;
    style?: React.CSSProperties;
}

export default function TextLoop({
    children,
    interval = 3000,
    className = '',
    style = {}
}: TextLoopProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setIsAnimating(true);

            setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % children.length);
                setIsAnimating(false);
            }, 500); // Half of the animation duration
        }, interval);

        return () => clearInterval(timer);
    }, [children.length, interval]);

    return (
        <span
            className={className}
            style={{
                display: 'inline-block',
                position: 'relative',
                ...style,
            }}
        >
            <span
                style={{
                    display: 'inline-block',
                    transition: 'all 0.5s ease-in-out',
                    transform: isAnimating ? 'translateY(-20px)' : 'translateY(0)',
                    opacity: isAnimating ? 0 : 1,
                }}
            >
                {children[currentIndex]}
            </span>
        </span>
    );
}
