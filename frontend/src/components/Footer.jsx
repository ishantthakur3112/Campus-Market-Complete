import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div>
            <h3 className="footer-brand">CampusMarket</h3>
            <p>
              Empowering students through a sustainable and connected campus
              economy.
            </p>
          </div>

          <div>
            <h4>Support & Help</h4>
            <p>support@campusmarket.edu</p>
            <p>+91 9187-4902879</p>
          </div>

          <div>
            <h4>Our Location</h4>
            <p>Sardar Beant Singh State University,</p>
            <p>Gurdaspur, Punjab 143530</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © 2026 CampusMarket. All rights reserved. Verified by University
            Administration.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;