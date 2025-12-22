
import React from 'react';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors
import * as ReactRouterDom from 'react-router-dom';
const { Link } = ReactRouterDom as any;
import { COLORS } from '../constants';

const MaintenancePage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
            <div className="max-w-2xl animate-fade-in">
                {/* Visual Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 animate-pulse">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L11.014 10.02M11.91 15.17l.406-5.15m-10.96 5.61L4.003 4.103a.75.75 0 011.14-.553l15.34 9.17a.75.75 0 010 1.28L5.143 23.17a.75.75 0 01-1.14-.553l-2.646-8.995z" />
                            </svg>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full border shadow-sm">
                             <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
                    Refining Your <span className="text-rose-600">Experience</span>
                </h1>
                
                <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-lg mx-auto">
                    We're currently performing some scheduled maintenance to bring you new collections and a smoother shopping journey. We'll be back online shortly!
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a 
                        href="https://wa.me/919876543210" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-8 py-3 bg-rose-600 text-white font-bold rounded-full shadow-lg hover:bg-rose-700 transition-all transform hover:scale-105 active:scale-95"
                    >
                        Contact Support
                    </a>
                    <Link 
                        to="/login" 
                        className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors underline underline-offset-4"
                    >
                        Staff Login
                    </Link>
                </div>

                <div className="mt-20 pt-8 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-[0.3em] font-bold">
                        Ladies Smart Choice
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;
