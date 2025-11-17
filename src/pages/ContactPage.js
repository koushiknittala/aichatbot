import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../App.css';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' }
];

function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">
      <Header
        navLinks={navLinks}
        rightContent={
          <button className="admin-tab" type="button" onClick={() => navigate('/admin/login')}>
            Admin
          </button>
        }
      />
      <main className="page-content">
        <section className="page-section">
          <h1>Connect With MSME ONE</h1>
          <p>
            We partner with development officers, incubators, and MSME owners to make policy guidance easy.
            Reach out for onboarding, integration help, or collaborative programmes.
          </p>
        </section>
        <section className="contact-grid">
          <div className="contact-card">
            <h3>Email</h3>
            <p>support@msmeone.in</p>
            <p>Share your use case or questions. We typically reply within one business day.</p>
          </div>
          <div className="contact-card">
            <h3>Phone</h3>
            <p>+91 98765 43210</p>
            <p>Available Monday to Friday, 9:00 AM – 6:00 PM IST.</p>
          </div>
          <div className="contact-card">
            <h3>Visit</h3>
            <p>MSME Facilitation Centre, Hyderabad</p>
            <p>Book a slot for in-person demos and onboarding workshops.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ContactPage;




