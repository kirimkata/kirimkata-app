// Shared styles for editor components
export const editorStyles = `
  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-row:last-child {
    margin-bottom: 0;
  }

  .form-group {
    position: relative;
  }

  .form-group label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.375rem;
  }

  .form-group textarea {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-family: 'Segoe UI', sans-serif;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    box-sizing: border-box;
    resize: vertical;
    min-height: 80px;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-family: 'Segoe UI', sans-serif;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-group input:disabled,
  .form-group textarea:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }

  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: #9ca3af;
    font-size: 0.8125rem;
  }

  .input-with-prefix {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-with-prefix .prefix {
    position: absolute;
    left: 0.75rem;
    color: #6b7280;
    font-size: 0.875rem;
    pointer-events: none;
  }

  .input-with-prefix input {
    padding-left: 1.75rem;
  }

  .required {
    color: #ef4444;
  }

  .collapsible-section {
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: visible;
  }

  .section-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1rem;
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Segoe UI', sans-serif;
  }

  .section-header:hover {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  }

  .section-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #374151;
  }

  .chevron {
    font-size: 0.75rem;
    color: #6b7280;
    transition: transform 0.2s ease;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .section-content {
    padding: 1rem;
    background: white;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Mobile Responsive */
  @media (max-width: 767px) {
    .form-row {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .section-header {
      padding: 0.75rem;
    }

    .section-content {
      padding: 0.75rem;
    }
  }
`;
