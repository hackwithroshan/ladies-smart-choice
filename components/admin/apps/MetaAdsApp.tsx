import React, { useState, useEffect } from 'react';
import {
    Facebook, RefreshCw, Layers, ExternalLink, Settings,
    CheckCircle2, AlertTriangle, ShieldCheck, Activity, Info
} from 'lucide-react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Separator } from '../../ui/separator';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../../ui/alert-dialog";

interface MetaAdsAppProps {
    token: string | null;
}

const MetaAdsApp: React.FC<MetaAdsAppProps> = ({ token }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [connected, setConnected] = useState(false);
    const [settings, setSettings] = useState<any>({
        pixelId: '', accessToken: '', businessId: '', lastSync: null
    });
    const [metaInfo, setMetaInfo] = useState<any>(null); // Real Graph API Data
    const [productStatus, setProductStatus] = useState({ total: 0, approved: 0, pending: 0, errors: 0 });
    const [products, setProducts] = useState<any[]>([]); // Product List for Table
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [testCode, setTestCode] = useState('');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/apps/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.meta && data.meta.connected) {
                setConnected(true);
                setSettings({
                    pixelId: data.meta.pixelId,
                    lastSync: data.meta.lastSync
                });
                fetchProductStats();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductStats = async () => {
        try {
            // Get Info (Pixel/Catalog Details)
            const infoRes = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/meta-app/info`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const infoData = await infoRes.json();
            if (infoData.connected) setMetaInfo(infoData);

            // Get Products List
            const pRes = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/meta-app/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const pData = await pRes.json();
            setProducts(pData);

            // Calculate Stats
            const total = pData.length;
            const errors = pData.filter((p: any) => p.metaStatus === 'Error').length;
            const pending = pData.filter((p: any) => p.metaStatus === 'Pending').length;
            setProductStatus({
                total,
                approved: total - errors - pending,
                pending,
                errors
            });

        } catch (e) { console.error(e); }
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/apps/meta/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            setConnected(true);
            fetchProductStats();
        } catch (e) { alert("Connection failed"); }
        finally { setLoading(false); }
    };

    const handleDisconnect = async () => {
        try {
            await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/apps/meta/disconnect`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setConnected(false);
            setSettings({ pixelId: '', accessToken: '', businessId: '', lastSync: null });
            setProductStatus({ total: 0, approved: 0, pending: 0, errors: 0 });
        } catch (e) {
            console.error(e);
            alert("Failed to disconnect");
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/apps/meta/sync`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTimeout(fetchStatus, 2000);
        } catch (e) { console.error(e); }
        finally { setSyncing(false); }
    };

    const handleTestEvent = async () => {
        if (!testCode) return;
        setTesting(true);
        try {
            const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:5000'}/api/integrations/facebook/test-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ testEventCode: testCode })
            });
            const data = await res.json();
            setTestResult({ success: data.success, time: new Date().toLocaleTimeString() });
        } catch (e) {
            setTestResult({ success: false, message: 'Request failed' });
        } finally { setTesting(false); }
    };

    if (loading && !connected) return <div className="p-8 text-center">Loading Meta App...</div>;

    if (!connected) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <Card className="border-t-4 border-t-[#0081FB] shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-blue-50 p-3 rounded-full w-fit mb-4">
                            <Facebook className="size-8 text-[#0081FB]" />
                        </div>
                        <CardTitle className="text-xl">Set up Facebook & Instagram</CardTitle>
                        <CardDescription>Connect your accounts to sync products and track ad performance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="bg-gray-50 p-4 rounded-lg border text-sm text-gray-600 space-y-2">
                            <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-green-600" /> Sync products to Facebook & Instagram Shop</p>
                            <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-green-600" /> Track conversions with Pixel & CAPI</p>
                            <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-green-600" /> Run dynamic retargeting ads</p>
                        </div>

                        <div className="space-y-3">
                            <div className="grid gap-1">
                                <Label>Meta Pixel ID</Label>
                                <Input placeholder="1234567890" value={settings.pixelId} onChange={e => setSettings({ ...settings, pixelId: e.target.value })} />
                            </div>
                            <div className="grid gap-1">
                                <Label>Access Token (System User)</Label>
                                <Input type="password" placeholder="EAA..." value={settings.accessToken} onChange={e => setSettings({ ...settings, accessToken: e.target.value })} />
                                <p className="text-xs text-muted-foreground">Get from Business Settings {'>'} System Users</p>
                            </div>
                        </div>

                        <Button className="w-full bg-[#0081FB] hover:bg-blue-700" onClick={handleConnect} disabled={loading}>
                            {loading ? 'Connecting...' : 'Connect Account'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-[#0081FB] text-white p-2 rounded-lg"><Facebook className="size-5" /></div>
                    <h1 className="text-xl font-bold text-gray-900">Facebook & Instagram</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open('https://business.facebook.com', '_blank')}>
                        <ExternalLink className="size-4 mr-2" /> Open Business Manager
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-6">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0081FB] data-[state=active]:text-[#0081FB] px-0 py-3 font-semibold">Overview</TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0081FB] data-[state=active]:text-[#0081FB] px-0 py-3 font-semibold">Settings</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-6 pt-6">

                    {/* Product Status Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 mb-2">Active</Badge>
                                    <CardTitle className="text-base">Product Status</CardTitle>
                                </div>
                                <Layers className="text-gray-400 size-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-3xl font-black text-gray-900">{productStatus.total}</span>
                                <span className="text-sm text-gray-500">products synced</span>
                            </div>
                            <div className="text-sm text-gray-500">
                                {productStatus.pending > 0 && <span>{productStatus.pending} pending approval. </span>}
                                {productStatus.errors > 0 ? <span className="text-red-500 font-medium">{productStatus.errors} errors found.</span> : <span className="text-green-600">All products approved.</span>}
                            </div>
                        </CardContent>
                        <CardFooter className="border-t bg-gray-50/50 py-3">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="link" className="p-0 h-auto text-blue-600 font-semibold text-xs">View all synced products</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Synced Products</DialogTitle>
                                        <DialogDescription>
                                            Real-time sync status of your catalog.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px]">Image</TableHead>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Meta ID</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {products.slice(0, 50).map((product) => (
                                                    <TableRow key={product.id}>
                                                        <TableCell><img src={product.image} className="size-10 rounded object-cover border" /></TableCell>
                                                        <TableCell className="font-medium">
                                                            <div>{product.name}</div>
                                                            <div className="text-xs text-gray-500">{product.sku}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {product.metaStatus === 'Synced' && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Synced</Badge>}
                                                            {product.metaStatus === 'Pending' && <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pending</Badge>}
                                                            {product.metaStatus === 'Error' && <Badge variant="destructive">{product.error}</Badge>}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-gray-500">{product.metaId}</TableCell>
                                                        <TableCell className="text-right">{product.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Connected Catalog */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <RefreshCw className="size-4 text-gray-500" /> Catalog Sync
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm py-2 border-b">
                                    <span className="text-gray-500">Sync Status</span>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Up to date</Badge>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b">
                                    <span className="text-gray-500">Last Sync</span>
                                    <span className="font-medium">{metaInfo?.catalog?.lastSync ? new Date(metaInfo.catalog.lastSync).toLocaleString() : 'Just now'}</span>
                                </div>
                                {metaInfo?.catalog && (
                                    <div className="flex justify-between text-sm py-2 border-b">
                                        <span className="text-gray-500">Catalog Name</span>
                                        <span className="font-medium truncate max-w-[150px]">{metaInfo.catalog.name}</span>
                                    </div>
                                )}
                                <div className="pt-2">
                                    <Button variant="outline" size="sm" className="w-full" onClick={handleSync} disabled={syncing}>
                                        {syncing ? 'Syncing...' : 'Sync Products Now'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recommendations */}
                        <Card className="bg-blue-50/50 border-blue-100">
                            <CardHeader>
                                <CardTitle className="text-base text-blue-900">Next Steps</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-blue-800">
                                    Your data sharing is set to <span className="font-bold">Maximum</span>. This ensures highest ad performance using Pixel + CAPI.
                                </p>
                                <Button size="sm" className="bg-[#0081FB] hover:bg-blue-700 w-full">Review Ad Settings</Button>
                            </CardContent>
                        </Card>
                    </div>

                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="space-y-6 pt-6 animate-fade-in">

                    {/* Pixel & CAPI Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Data Sharing & Tracking</CardTitle>
                            <CardDescription>Manage how customer data is shared with Meta.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-4 p-4 border rounded-lg bg-gray-50">
                                <ShieldCheck className="size-6 text-green-600 mt-1" />
                                <div>
                                    <h4 className="font-bold text-gray-900">Maximum (Pixel + CAPI)</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Using both Browser Pixel and Server-Side API for maximum deduplication and ad performance.
                                    </p>
                                </div>
                                <Badge className="ml-auto bg-green-600">Active</Badge>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                                <h5 className="text-sm font-bold text-gray-900 border-b pb-2">Behavior will be tracked with this dataset</h5>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-500 text-xs uppercase mb-1">Dataset / Pixel</div>
                                        <div className="font-medium">{metaInfo?.pixel?.name || 'Loading...'}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs uppercase mb-1">Pixel ID</div>
                                        <div className="font-mono">{metaInfo?.pixel?.id || settings.pixelId}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs uppercase mb-1">Business Account</div>
                                        <div className="font-medium">{metaInfo?.pixel?.businessName || 'Loading...'}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-xs uppercase mb-1">CAPI Status</div>
                                        <div className="flex items-center gap-1 text-green-600 font-bold">
                                            <span className="size-2 rounded-full bg-green-600"></span> Enabled
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <div className="text-gray-500 text-xs uppercase mb-2">Active Events</div>
                                    <div className="flex flex-wrap gap-2">
                                        {['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'].map(evt => (
                                            <Badge key={evt} variant="secondary" className="bg-white border text-xs">{evt}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Separator />
                        </CardContent>
                    </Card>

                    {/* Server Test Console */}
                    <Card className="border-gray-300 shadow-none">
                        <CardHeader className="bg-gray-50 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Activity className="size-4" /> Server Event Testing
                            </CardTitle>
                            <CardDescription>Validate your CAPI connection before running ads.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex gap-4 items-end">
                                <div className="grid gap-2 flex-1">
                                    <Label>Test Event Code</Label>
                                    <Input
                                        placeholder="TEST12345"
                                        value={testCode}
                                        onChange={e => setTestCode(e.target.value)}
                                        className="font-mono uppercase"
                                    />
                                </div>
                                <Button onClick={handleTestEvent} disabled={testing || !testCode}>
                                    {testing ? 'Sending...' : 'Send Test PageView'}
                                </Button>
                            </div>

                            {testResult && (
                                <Alert className={testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                                    {testResult.success ? <CheckCircle2 className="size-4 text-green-600" /> : <AlertTriangle className="size-4 text-red-600" />}
                                    <AlertTitle>{testResult.success ? "Event Sent Successfully" : "Failed to Send"}</AlertTitle>
                                    <AlertDescription className="text-xs text-gray-500 flex justify-between mt-1">
                                        <span>Server time: {testResult.time}</span>
                                        {testResult.success && <a href="https://business.facebook.com/events_manager2" target="_blank" className="underline">Verify in Events Manager</a>}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Info className="size-3" /> Find this code in Events Manager {'>'} Test Events.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">Disconnect Account</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Disconnect Facebook & Instagram account?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will stop all ads tracking, Pixel & CAPI events, and your product catalog sync. You can reconnect at any time.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
                                        Disconnect
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MetaAdsApp;
