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

function AboutPage() {
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
          <h1>About MSME ONE</h1>
          <p>
            MSME ONE is your digital partner for Micro, Small and Medium Enterprises. We help entrepreneurs
            navigate government programs, financial schemes, and compliance requirements with a friendly, multilingual
            AI assistant.
          </p>
        </section>
        <section className="page-grid">
          <div>
            <h2>Why we exist</h2>
            <p>
              MSMEs are the backbone of the economy. We simplify their journey by connecting them to verified
              resources, curated documentation, and smart guidance tailored to stage of business growth.
            </p>
          </div>
          <div>
            <h2>How we help</h2>
            <ul>
              <li>Interactive chatbot support in multiple Indian languages.</li>
              <li>Document upload and private knowledge training for your business.</li>
              <li>Quick answers about schemes, compliance, and best practices.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AboutPage;




