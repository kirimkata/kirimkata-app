import React from 'react';

interface TooltipProps {
  text: string;
  id: string;
  activeTooltip: string | null;
  onToggle: (id: string, e: React.MouseEvent) => void;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, id, activeTooltip, onToggle }) => (
  <div className="tooltip-wrapper">
    <span className="info-icon" onClick={(e) => onToggle(id, e)}>
      ℹ️
    </span>
    {activeTooltip === id && <div className="tooltip-content">{text}</div>}

    <style jsx>{`
      .tooltip-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
      }

      .info-icon {
        font-size: 0.75rem;
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.2s;
        user-select: none;
      }

      .info-icon:hover {
        opacity: 1;
        transform: scale(1.1);
      }

      .info-icon:active {
        transform: scale(0.95);
      }

      .tooltip-content {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: #1f2937;
        color: white;
        font-size: 0.75rem;
        line-height: 1.4;
        border-radius: 0.375rem;
        white-space: nowrap;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: tooltipFadeIn 0.2s ease;
      }

      @keyframes tooltipFadeIn {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }

      .tooltip-content::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #1f2937;
      }
    `}</style>
  </div>
);
