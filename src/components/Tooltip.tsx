import React, { useState, cloneElement, useEffect, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content?: string;
    children: ReactElement<any>;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleScroll = () => setVisible(false);
        if (visible) {
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [visible]);

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
        if (children.props.onMouseEnter) children.props.onMouseEnter(e);
        if (!content) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
        });
        setVisible(true);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
        setVisible(false);
        if (children.props.onMouseLeave) children.props.onMouseLeave(e);
    };

    const triggerProps = {
        ...children.props,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        title: undefined // Remove native title
    };

    return (
        <>
            {cloneElement(children, triggerProps)}
            {visible && content && createPortal(
                <div 
                    className="custom-tooltip"
                    style={{ left: `${coords.x}px`, top: `${coords.y}px`, transform: 'translate(-50%, -100%)' }}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
};
