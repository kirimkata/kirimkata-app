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
    color: #F5F5F0;
    margin-bottom: 0.375rem;
  }

  .form-group textarea {
    width: 100%;
    padding: 0.625rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    color: #F5F5F0;
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
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05);
    color: #F5F5F0;
    border-radius: 0.375rem;
    font-family: 'Segoe UI', sans-serif;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.08);
  }

  .form-group input:disabled,
  .form-group textarea:disabled {
    background-color: rgba(255, 255, 255, 0.02);
    cursor: not-allowed;
    color: rgba(245, 245, 240, 0.3);
  }

  .form-group input::placeholder,
  .form-group textarea::placeholder {
    color: rgba(245, 245, 240, 0.3);
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
    color: rgba(245, 245, 240, 0.6);
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
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    overflow: visible;
  }

  .section-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.875rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Segoe UI', sans-serif;
  }

  .section-header:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .section-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #F5F5F0;
  }

  .chevron {
    font-size: 0.75rem;
    color: rgba(245, 245, 240, 0.6);
    transition: transform 0.2s ease;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .section-content {
    padding: 1rem;
    background: transparent;
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
