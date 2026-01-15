
import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { getApiUrl } from '../../utils/apiHelper';
import MediaPicker from './MediaPicker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AlertCircle, CheckCircle2, Save, Store, Globe, Phone, Building2, Palette } from 'lucide-react';

interface StoreDetails {
    storeName?: string;
    logoUrl?: string;
    faviconUrl?: string;
    shortDescription?: string;
    longDescription?: string;
    businessType?: 'Individual' | 'Company';
    ownerName?: string;
    legalName?: string;
    companyEmail?: string;
    companyPhone?: string;
    websiteUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    gstin?: string;
    currency?: string;
    timezone?: string;
    language?: string;
}

const BrandingSettings: React.FC<{ token: string | null }> = ({ token }) => {
    const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings>>({});
    const [storeDetails, setStoreDetails] = useState<StoreDetails>({});

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [siteRes, detailsRes] = await Promise.all([
                    fetch(getApiUrl('/api/settings/site')),
                    fetch(getApiUrl('/settings/store-details'))
                ]);

                if (siteRes.ok) setSiteSettings(await siteRes.json());
                if (detailsRes.ok) setStoreDetails(await detailsRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSiteSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setStoreDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDetailsSelect = (name: string, value: string) => {
        setStoreDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            // Sync store name/logo/favicon from site settings to store details if modified
            const updatedDetails = {
                ...storeDetails,
                storeName: siteSettings.storeName,
                logoUrl: siteSettings.logoUrl,
                faviconUrl: siteSettings.faviconUrl
            };

            const [siteRes, detailsRes] = await Promise.all([
                fetch(getApiUrl('/api/settings/site'), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(siteSettings)
                }),
                fetch(getApiUrl('/settings/store-details'), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(updatedDetails)
                })
            ]);

            if (siteRes.ok && detailsRes.ok) {
                setFeedback({ type: 'success', message: 'All settings saved successfully!' });

                // Update CSS variables for immediate preview
                document.documentElement.style.setProperty('--brand-primary', siteSettings.primaryColor || '#16423C');
                document.documentElement.style.setProperty('--brand-accent', siteSettings.accentColor || '#6A9C89');

                // Update state
                setStoreDetails(updatedDetails);
            } else {
                throw new Error('Some settings failed to save.');
            }
        } catch (err: any) {
            setFeedback({ type: 'error', message: 'Failed to save settings. Please try again.' });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 4000);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64 text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500 mr-3"></div>
            Loading settings...
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">Rebranding & Business Details</h3>
                    <p className="text-sm text-zinc-500 mt-1">Manage your brand identity, business information, and regional preferences.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="shadow-md min-w-[140px]"
                >
                    {saving ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                            Saving...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            Save Changes
                        </div>
                    )}
                </Button>
            </div>

            {feedback && (
                <div className={`p-4 rounded-lg flex items-center gap-3 border ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{feedback.message}</span>
                </div>
            )}

            <Tabs defaultValue="identity" className="w-full">
                <TabsList className="bg-zinc-100 p-1 rounded-lg mb-6">
                    <TabsTrigger value="identity" className="flex items-center gap-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Palette className="w-4 h-4" /> Brand Identity
                    </TabsTrigger>
                    <TabsTrigger value="business" className="flex items-center gap-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Building2 className="w-4 h-4" /> Business Info
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="flex items-center gap-2 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Phone className="w-4 h-4" /> Contact & Region
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB 1: VISUAL IDENTITY --- */}
                <TabsContent value="identity" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Brand Colors & Name */}
                        <Card>
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg">Visual Identity</CardTitle>
                                <CardDescription>Core brand elements visible to your customers.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label>Store Name</Label>
                                    <Input
                                        name="storeName"
                                        value={siteSettings.storeName || ''}
                                        onChange={handleSiteChange}
                                        placeholder="e.g. My Awesome Store"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Primary Color</Label>
                                        <div className="flex gap-2">
                                            <div className="relative shrink-0">
                                                <Input
                                                    type="color"
                                                    name="primaryColor"
                                                    value={siteSettings.primaryColor || '#16423C'}
                                                    onChange={handleSiteChange}
                                                    className="h-10 w-12 p-1 cursor-pointer"
                                                />
                                            </div>
                                            <Input
                                                name="primaryColor"
                                                value={siteSettings.primaryColor || ''}
                                                onChange={handleSiteChange}
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Accent Color</Label>
                                        <div className="flex gap-2">
                                            <div className="relative shrink-0">
                                                <Input
                                                    type="color"
                                                    name="accentColor"
                                                    value={siteSettings.accentColor || '#6A9C89'}
                                                    onChange={handleSiteChange}
                                                    className="h-10 w-12 p-1 cursor-pointer"
                                                />
                                            </div>
                                            <Input
                                                name="accentColor"
                                                value={siteSettings.accentColor || ''}
                                                onChange={handleSiteChange}
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Logos */}
                        <Card>
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg">Assets</CardTitle>
                                <CardDescription>Images used for header and browser identification.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label>Main Logo</Label>
                                    <MediaPicker
                                        type="image"
                                        value={siteSettings.logoUrl || ''}
                                        onChange={url => setSiteSettings(prev => ({ ...prev, logoUrl: url }))}
                                    />
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>Favicon</Label>
                                    <MediaPicker
                                        type="image"
                                        value={siteSettings.faviconUrl || ''}
                                        onChange={url => setSiteSettings(prev => ({ ...prev, faviconUrl: url }))}
                                    />
                                    <p className="text-xs text-zinc-400">Recommended size: 32x32px or 64x64px.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- TAB 2: BUSINESS INFO --- */}
                <TabsContent value="business">
                    <Card>
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-lg">Legal Business Information</CardTitle>
                            <CardDescription>Details used for invoices and legal compliance.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Legal Business Name</Label>
                                    <Input
                                        name="legalName"
                                        value={storeDetails.legalName || ''}
                                        onChange={handleDetailsChange}
                                        placeholder="Legal Company Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Business Type</Label>
                                    <Select
                                        value={storeDetails.businessType || 'Individual'}
                                        onValueChange={(val) => handleDetailsSelect('businessType', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Individual">Individual / Sole Proprietor</SelectItem>
                                            <SelectItem value="Company">Registered Company (LLP/Pvt Ltd)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Business Email (Internal)</Label>
                                    <Input
                                        name="companyEmail"
                                        value={storeDetails.companyEmail || ''}
                                        onChange={handleDetailsChange}
                                        placeholder="admin@company.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Business Phone (Internal)</Label>
                                    <Input
                                        name="companyPhone"
                                        value={storeDetails.companyPhone || ''}
                                        onChange={handleDetailsChange}
                                        placeholder="+91 ..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>GSTIN / Tax ID</Label>
                                    <Input
                                        name="gstin"
                                        value={storeDetails.gstin || ''}
                                        onChange={handleDetailsChange}
                                        placeholder="e.g. 29ABCDE1234F1Z5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website URL</Label>
                                    <Input
                                        name="websiteUrl"
                                        value={storeDetails.websiteUrl || ''}
                                        onChange={handleDetailsChange}
                                        placeholder="https://www.yourstore.com"
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Registered Business Address (Full)</Label>
                                <Textarea
                                    name="address"
                                    value={storeDetails.address || ''}
                                    onChange={handleDetailsChange}
                                    placeholder="Number, Street, Floor, etc."
                                    className="min-h-[100px]"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB 3: CONTACT & REGION --- */}
                <TabsContent value="contact" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Section 1: Location Details */}
                        <Card>
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg">Location Details</CardTitle>
                                <CardDescription>Physical location for shipping calculation.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label>Country / Region</Label>
                                    <Select
                                        value={storeDetails.country || 'India'}
                                        onValueChange={(val) => handleDetailsSelect('country', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="India">India</SelectItem>
                                            <SelectItem value="United States">United States</SelectItem>
                                            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                            <SelectItem value="Canada">Canada</SelectItem>
                                            <SelectItem value="Australia">Australia</SelectItem>
                                            <SelectItem value="UAE">United Arab Emirates</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>State / Province</Label>
                                        <Input
                                            name="state"
                                            value={storeDetails.state || ''}
                                            onChange={handleDetailsChange}
                                            placeholder="State"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input
                                            name="city"
                                            value={storeDetails.city || ''}
                                            onChange={handleDetailsChange}
                                            placeholder="City"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Zip / Postal Code</Label>
                                    <Input
                                        name="zipCode"
                                        value={storeDetails.zipCode || ''}
                                        onChange={handleDetailsChange}
                                        placeholder="Zip Code"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 2: Regional Defaults */}
                        <Card>
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg">Regional Settings</CardTitle>
                                <CardDescription>Currency, language, and timezone defaults.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label>Store Currency</Label>
                                    <Select
                                        value={storeDetails.currency || 'INR'}
                                        onValueChange={(val) => handleDetailsSelect('currency', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="INR">Indian Rupee (INR)</SelectItem>
                                            <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                            <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                                            <SelectItem value="AED">UAE Dirham (AED)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Language</Label>
                                    <Select
                                        value={storeDetails.language || 'en-IN'}
                                        onValueChange={(val) => handleDetailsSelect('language', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en-IN">English (India)</SelectItem>
                                            <SelectItem value="en-US">English (US)</SelectItem>
                                            <SelectItem value="hi">Hindi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Timezone</Label>
                                    <Select
                                        value={storeDetails.timezone || 'Asia/Kolkata'}
                                        onValueChange={(val) => handleDetailsSelect('timezone', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                                            <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                                            <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                                            <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 3: Support Contact */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="text-lg">Customer Support Contact</CardTitle>
                                <CardDescription>Public contact details displayed on the store.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Support Email</Label>
                                        <Input
                                            name="contactEmail"
                                            value={storeDetails.contactEmail || ''}
                                            onChange={handleDetailsChange}
                                            placeholder="support@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Support Phone</Label>
                                        <Input
                                            name="contactPhone"
                                            value={storeDetails.contactPhone || ''}
                                            onChange={handleDetailsChange}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default BrandingSettings;
