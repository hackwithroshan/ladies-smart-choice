
import React from 'react';
import { Button } from "../ui/button";
import { FileText } from 'lucide-react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;

const Drafts: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full space-y-4">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 px-1">Drafts</h1>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center p-8 space-y-6">
                <div className="relative">
                    <div className="bg-teal-600/10 rounded-full p-4 w-24 h-24 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 w-full h-1/2 bg-white/20"></div>
                        <FileText className="w-10 h-10 text-teal-600" />
                    </div>
                </div>

                <div className="text-center space-y-2 max-w-sm">
                    <h2 className="text-base font-bold text-gray-900">Manually create orders and invoices</h2>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Use draft orders to take orders over the phone, email invoices to customers, and collect payments.
                    </p>
                </div>

                <Button
                    onClick={() => navigate('/app/orders/new')}
                    className="bg-zinc-900 text-white hover:bg-zinc-800 font-bold text-xs h-9 px-4 rounded-md shadow-sm transition-all active:scale-95"
                >
                    Create draft order
                </Button>
            </div>
            <div className="text-center pt-2">
                <p className="text-xs font-medium text-gray-500 cursor-pointer hover:underline hover:text-zinc-800 transition-colors">
                    Learn more about creating draft orders
                </p>
            </div>
        </div>
    );
};

export default Drafts;
