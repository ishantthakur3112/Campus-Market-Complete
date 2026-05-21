import React, { useState } from 'react';
import './CheckoutModal.css'; // This is the ONLY import you need here

function CheckoutModal({ total, onConfirm, onClose }) {
  const [paymentMethod, setPaymentMethod] = useState(null);

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content">
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <h2 className="glow-text">Finalize Order</h2>
        <p style={{ marginBottom: '20px' }}>
          Amount to Pay: <span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{total}</span>
        </p>

        {!paymentMethod ? (
          <div className="payment-options">
            <button className="method-btn" onClick={() => setPaymentMethod('UPI')}>
              📱 Pay via UPI / QR Code
            </button>
            <button className="method-btn" onClick={() => setPaymentMethod('COD')}>
              🤝 Cash on Delivery (Meet on Campus)
            </button>
          </div>
        ) : (
          <div className="payment-confirmation">
            {paymentMethod === 'UPI' && (
              <div className="qr-section">
                <p>Scan to Pay Seller</p>
                <div className="qr-box">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CampusMarket-Payment-${total}`} 
                    alt="Payment QR" 
                  />
                </div>
              </div>
            )}
            
            <p style={{ margin: '15px 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              {paymentMethod === 'UPI' ? "Once scanned and paid, click confirm." : "You will pay the seller when you meet on campus."}
            </p>

            <button className="cyber-button" onClick={() => onConfirm(paymentMethod)}>
              CONFIRM ORDER
            </button>
            <button 
              className="nav-link" 
              onClick={() => setPaymentMethod(null)} 
              style={{ background: 'none', border: 'none', marginTop: '10px', cursor: 'pointer' }}
            >
              Back to options
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;   