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

const services = [
  {
    title: 'Guided Assistance',
    description: 'Ask questions about registrations, loans, and compliance using conversational AI.'
  },
  {
    title: 'Document Intelligence',
    description: 'Upload policy documents, SOPs, or FAQs and train agents to answer with organisation context.'
  },
  {
    title: 'Multilingual Support',
    description: 'Serve stakeholders in English, Hindi, Telugu, Tamil, Kannada, and Malayalam effortlessly.'
  }
];

function ServicesPage() {
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
          <h1>Services for MSMEs</h1>
          <p>
            Every business needs timely information. MSME ONE automates responses, streamlines knowledge sharing,
            and keeps your team aligned with policies, schemes, and compliance obligations.
          </p>
        </section>
        <section className="card-grid">
          {services.map((service) => (
            <article key={service.title} className="info-card">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default ServicesPage;




