
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useSiteData } from '../contexts/SiteDataContext';
import { getApiUrl } from '../utils/apiHelper';

const MegaMenu: React.FC = () => {
  const { categories } = useSiteData();
  const [featuredProduct, setFeaturedProduct] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const featuredProductFetched = useRef(false); // Ref to prevent re-fetching

  useEffect(() => {
    // Fetch featured product only when the menu is opened for the first time
    if (isOpen && !featuredProductFetched.current) {
      const fetchFeatured = async () => {
        try {
          const res = await fetch(getApiUrl('/products/featured'));
          if (res.ok) {
            const data = await res.json();
            setFeaturedProduct(data[0] || null); // API now returns an array, take the first item
            featuredProductFetched.current = true; // Mark as fetched
          }
        } catch (error) {
          console.error("Failed to fetch featured product:", error);
        }
      };
      
      fetchFeatured();
    }
  }, [isOpen]); // Depend on isOpen to trigger the fetch


  return (
    <div 
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
    >
        <button className="flex items-center text-white px-4 py-2.5 rounded-md font-semibold hover:opacity-90 transition-colors" style={{backgroundColor: '#881337'}}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="ml-2">Shop Categories</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
        {isOpen && (
            <div className="absolute left-0 mt-2 w-screen max-w-4xl z-50 animate-fade-in-up">
              <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
                <div className="relative grid gap-6 bg-white px-5 py-6 sm:gap-8 sm:p-8 lg:grid-cols-3">
                  {categories.slice(0, 2).map((category) => ( // Show first 2 columns for categories
                    <div key={category.id}>
                      <h3 className="text-sm tracking-wide font-semibold uppercase text-blue-600">{category.name}</h3>
                      <ul className="mt-4 space-y-2">
                        {category.subcategories.map((sub) => (
                          <li key={sub.id}>
                            <Link to="/" className="text-base font-medium text-gray-900 hover:text-gray-700 transition duration-150 ease-in-out">{sub.name}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {featuredProduct ? (
                    <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4 flex flex-col justify-between">
                      <div>
                          <h3 className="text-sm tracking-wide font-semibold uppercase text-gray-500">Featured Product</h3>
                          <div className="mt-4">
                              <img src={featuredProduct.imageUrl} alt={featuredProduct.name} className="rounded-lg object-cover h-40 w-full" />
                              <h4 className="mt-4 text-base font-bold text-gray-900">{featuredProduct.name}</h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{featuredProduct.description}</p>
                          </div>
                      </div>
                       <Link to={`/product/${featuredProduct.slug}`} className="mt-6 block w-full text-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm">Shop Now</Link>
                    </div>
                  ) : (
                     <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                        <p>Loading feature...</p>
                     </div>
                  )}
                </div>
              </div>
            </div>
        )}
    </div>
  );
};

export default MegaMenu;
