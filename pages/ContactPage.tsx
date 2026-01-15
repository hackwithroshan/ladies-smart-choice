
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorMessage from '../components/ErrorMessage';
import { getApiUrl } from '../utils/apiHelper';
import { useSiteData } from '../contexts/SiteDataContext';

interface ContactPageProps {
    user: any;
    logout: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ user, logout }) => {
    const { storeDetails } = useSiteData();
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const formattedAddress = [
        storeDetails?.address,
        storeDetails?.city,
        storeDetails?.state,
        storeDetails?.zipCode,
        storeDetails?.country
    ].filter(Boolean).join(', ') || "123 Fashion Ave, Mumbai, Maharashtra 400001, India";

    const address = formattedAddress;
    const email = storeDetails?.contactEmail || "support@ladiessmartchoice.com";
    const phone = storeDetails?.contactPhone || "+91 987 654 3210";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFeedback(null);

        try {
            const response = await fetch(getApiUrl('/contact/send'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'An error occurred.');
            }

            setFeedback({ type: 'success', message: result.message });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white">
            <Helmet>
                <title>Contact Us | Ladies Smart Choice</title>
                <meta name="description" content="Get in touch with Ladies Smart Choice. We're here to help with your questions about orders, products, or any other inquiries." />
            </Helmet>
            <Header user={user} logout={logout} />

            <main>
                <div className="bg-gray-50 py-16 text-center">
                    <h1 className="text-4xl font-serif font-bold text-gray-900">Get In Touch</h1>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">We'd love to hear from you. Whether you have a question about our products, your order, or anything else, our team is ready to answer all your questions.</p>
                </div>

                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* Contact Info Section */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold font-serif text-gray-800 mb-6">Contact Information</h2>
                                <div className="space-y-4">
                                    <InfoItem icon={<IconLocation />} title="Our Address" text={address} />
                                    <InfoItem icon={<IconEmail />} title="Email Us" text={email} />
                                    <InfoItem icon={<IconPhone />} title="Call Us" text={phone} />
                                </div>
                            </div>
                            <div className="h-80 w-full rounded-lg overflow-hidden shadow-md">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241317.1160982322!2d72.74109713503926!3d19.0825020050808!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1678886472481!5m2!1sen!2sin"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={false}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Google Map of Mumbai"
                                ></iframe>
                            </div>
                        </div>

                        {/* Contact Form Section */}
                        <div className="bg-gray-50 p-8 rounded-lg border border-gray-100">
                            <h2 className="text-2xl font-bold font-serif text-gray-800 mb-6">Send us a Message</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <InputField id="name" name="name" label="Your Name" value={formData.name} onChange={handleInputChange} required />
                                    <InputField id="email" name="email" type="email" label="Your Email" value={formData.email} onChange={handleInputChange} required />
                                </div>
                                <InputField id="subject" name="subject" label="Subject" value={formData.subject} onChange={handleInputChange} required />
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                                    <textarea id="message" name="message" rows={5} value={formData.message} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-rose-500 focus:border-rose-500"></textarea>
                                </div>

                                {feedback && (
                                    feedback.type === 'success' ? (
                                        <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">{feedback.message}</div>
                                    ) : (
                                        <ErrorMessage message={feedback.message} />
                                    )
                                )}

                                <div>
                                    <button type="submit" disabled={loading} className="w-full bg-rose-600 text-white py-3 px-4 rounded-md font-bold hover:bg-rose-700 transition-colors disabled:opacity-50">
                                        {loading ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

// --- Helper Components for Contact Page ---

const InputField: React.FC<{ id: string, name: string, label: string, value: string, onChange: (e: any) => void, type?: string, required?: boolean }> = ({ id, name, label, value, onChange, type = 'text', required = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} id={id} name={name} value={value} onChange={onChange} required={required} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-rose-500 focus:border-rose-500" />
    </div>
);

const InfoItem: React.FC<{ icon: React.ReactNode, title: string, text: string }> = ({ icon, title, text }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center bg-rose-50 text-rose-600 rounded-full">
            {icon}
        </div>
        <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="text-gray-600">{text}</p>
        </div>
    </div>
);

const IconLocation = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconEmail = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const IconPhone = () => <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;

export default ContactPage;
