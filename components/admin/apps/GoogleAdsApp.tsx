import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, AlertCircle, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Badge } from '../../ui/badge';

interface GoogleAdsAppProps {
    token: string | null;
}

const GoogleAdsApp: React.FC<GoogleAdsAppProps> = ({ token }) => {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        adsId: '',
        conversionLabel: '',
        merchantId: ''
    });

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/apps/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.google) {
                setConnected(data.google.connected);
                setSettings(prev => ({
                    ...prev,
                    adsId: data.google.adsId || ''
                }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/apps/google/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                setConnected(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/apps/google/disconnect`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setConnected(false);
            setSettings({ adsId: '', conversionLabel: '', merchantId: '' });
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && !settings.adsId) {
        return <div className="p-8 text-center text-muted-foreground">Loading App...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-white text-white flex items-center justify-center shadow-sm border p-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="w-full" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Google Ads
                        {connected && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Connected</Badge>}
                    </h1>
                    <p className="text-muted-foreground font-medium">Reach customers across Google Search, YouTube, and the Web.</p>
                </div>
            </div>

            {connected ? (
                <div className="grid gap-6">
                    <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500 size-5" />
                                Tracking Active
                            </CardTitle>
                            <CardDescription>
                                Conversion events are being sent to Google Ads via Enhanced Tracking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="text-xs font-bold text-gray-500 uppercase">Conversion ID</div>
                                    <div className="font-mono font-medium text-gray-900 truncate">{settings.adsId}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="text-xs font-bold text-gray-500 uppercase">Tracking Scope</div>
                                    <div className="font-medium text-emerald-600 flex items-center gap-1">
                                        <BarChart3 className="size-3" />
                                        Purchase & Checkout
                                    </div>
                                </div>
                            </div>

                            <Button variant="destructive" size="sm" onClick={handleDisconnect} className="w-fit">
                                Disconnect
                            </Button>
                        </CardContent>
                    </Card>

                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Setup Reminder</AlertTitle>
                        <AlertDescription>
                            Ensure you have configured "Offline Conversions" or "Enhanced Conversions" in your Google Ads account to accept events from this API integration.
                        </AlertDescription>
                    </Alert>
                </div>
            ) : (
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>Connect Google Ads</CardTitle>
                        <CardDescription>
                            Enter your Conversion ID (AW-XXXXXXXX) to enable server-side tracking.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Conversion ID (AW-XXXXXXXX)</Label>
                            <Input
                                placeholder="AW-123456789"
                                value={settings.adsId}
                                onChange={e => setSettings(p => ({ ...p, adsId: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conversion Label (Optional)</Label>
                            <Input
                                placeholder="AbC_xYz123"
                                value={settings.conversionLabel}
                                onChange={e => setSettings(p => ({ ...p, conversionLabel: e.target.value }))}
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={handleConnect}
                                disabled={!settings.adsId || loading}
                            >
                                {loading ? 'Connecting...' : 'Connect Google Ads'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default GoogleAdsApp;
