
import React from 'react';

// Define common props for all icons to satisfy TypeScript
interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    size?: number | string;
    // Fix: Added strokeWidth and children to satisfy usages in Dashboard and BaseIcon
    strokeWidth?: number | string;
    children?: React.ReactNode;
}

const BaseIcon = ({ children, className, size = 24, ...props }: IconProps) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        {children}
    </svg>
);

export const LayoutDashboard = (props: IconProps) => (
    <BaseIcon {...props}><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></BaseIcon>
);

export const BarChart3 = (props: IconProps) => (
    <BaseIcon {...props}><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></BaseIcon>
);

export const Package = (props: IconProps) => (
    <BaseIcon {...props}><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></BaseIcon>
);

export const ShoppingCart = (props: IconProps) => (
    <BaseIcon {...props}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></BaseIcon>
);

export const Users = (props: IconProps) => (
    <BaseIcon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></BaseIcon>
);

export const BadgePercent = (props: IconProps) => (
    <BaseIcon {...props}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="M9 9h.01" /><path d="M15 15h.01" /></BaseIcon>
);

export const LayoutTemplate = (props: IconProps) => (
    <BaseIcon {...props}><rect width="18" height="7" x="3" y="3" rx="1" /><rect width="9" height="7" x="3" y="14" rx="1" /><rect width="5" height="7" x="16" y="14" rx="1" /></BaseIcon>
);

export const Video = (props: IconProps) => (
    <BaseIcon {...props}><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" /></BaseIcon>
);

export const Image = (props: IconProps) => (
    <BaseIcon {...props}><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></BaseIcon>
);

export const Settings = (props: IconProps) => (
    <BaseIcon {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></BaseIcon>
);

export const ChevronDown = (props: IconProps) => (
    <BaseIcon {...props}><path d="m6 9 6 6 6-6" /></BaseIcon>
);

// Added ChevronLeft for data-table pagination
export const ChevronLeft = (props: IconProps) => (
    <BaseIcon {...props}><path d="m15 18-6-6 6-6" /></BaseIcon>
);

export const ChevronRight = (props: IconProps) => (
    <BaseIcon {...props}><path d="m9 18 6-6-6-6" /></BaseIcon>
);

export const Sparkles = (props: IconProps) => (
    <BaseIcon {...props}><path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></BaseIcon>
);

export const TrendingUp = (props: IconProps) => (
    <BaseIcon {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></BaseIcon>
);

export const TrendingDown = (props: IconProps) => (
    <BaseIcon {...props}><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></BaseIcon>
);

export const IndianRupee = (props: IconProps) => (
    <BaseIcon {...props}><path d="M6 3h12" /><path d="M6 8h12" /><path d="m6 13 8.5 8" /><path d="M6 13h3" /><path d="M9 13c6.667 0 6.667-10 0-10" /></BaseIcon>
);

export const Activity = (props: IconProps) => (
    <BaseIcon {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></BaseIcon>
);

export const Clock = (props: IconProps) => (
    <BaseIcon {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></BaseIcon>
);

export const ArrowUpDown = (props: IconProps) => (
    <BaseIcon {...props}><path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /></BaseIcon>
);

export const MoreHorizontal = (props: IconProps) => (
    <BaseIcon {...props}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></BaseIcon>
);

export const UserIcon = (props: IconProps) => (
    <BaseIcon {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></BaseIcon>
);

export const HeartIcon = (props: IconProps) => (
    <BaseIcon {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></BaseIcon>
);

export const CartIcon = (props: IconProps) => (
    <BaseIcon {...props}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></BaseIcon>
);

export const SearchIcon = (props: IconProps) => (
    <BaseIcon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></BaseIcon>
);

export const MenuIcon = (props: IconProps) => (
    <BaseIcon {...props}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></BaseIcon>
);

export const PlayIcon = (props: IconProps) => (
    <BaseIcon {...props}><polygon points="5 3 19 12 5 21 5 3" /></BaseIcon>
);

export const StarIcon = (props: IconProps) => (
    <BaseIcon {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></BaseIcon>
);

export const CodeIcon = (props: IconProps) => (
    <BaseIcon {...props}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></BaseIcon>
);

export const NavArrowIcon = (props: IconProps) => (
    <BaseIcon {...props}><path d="m9 18 6-6-6-6" /></BaseIcon>
);

export const InstagramIcon = (props: IconProps) => (
    <BaseIcon {...props}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </BaseIcon>
);

export const FacebookIcon = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </BaseIcon>
);

export const YoutubeIcon = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </BaseIcon>
);

export const XIcon = (props: IconProps) => (
    <BaseIcon {...props}>
        <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
        <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </BaseIcon>
);

// Added Megaphone icon for AdminSidebar
export const Megaphone = (props: IconProps) => (
    <BaseIcon {...props}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></BaseIcon>
);

// Added Wand2 icon for AdminSidebar
export const Wand2 = (props: IconProps) => (
    <BaseIcon {...props}><path d="m2 21 21-21" /><path d="M14 7l3 3" /><path d="M9 12l3 3" /><path d="M5 16l3 3" /><path d="m19 2 1 1" /><path d="m21 4 1 1" /><path d="m22 2-1 1" /><path d="m19 5 1-1" /></BaseIcon>
);

// Added Mail icon for AdminSidebar
export const Mail = (props: IconProps) => (
    <BaseIcon {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></BaseIcon>
);

// Added FileText icon for AdminSidebar
export const FileText = (props: IconProps) => (
    <BaseIcon {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></BaseIcon>
);

// --- NEW ICONS FOR SETTINGS MODAL ---

export const Search = (props: IconProps) => (
    <BaseIcon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></BaseIcon>
);

export const X = (props: IconProps) => (
    <BaseIcon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></BaseIcon>
);

export const Home = (props: IconProps) => (
    <BaseIcon {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></BaseIcon>
);

export const CreditCard = (props: IconProps) => (
    <BaseIcon {...props}><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></BaseIcon>
);

export const Truck = (props: IconProps) => (
    <BaseIcon {...props}><rect width="16" height="13" x="2" y="4" rx="2" /><polyline points="18 8 22 8 22 17 18 17" /><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="15.5" cy="17.5" r="2.5" /></BaseIcon>
);

export const Palette = (props: IconProps) => (
    <BaseIcon {...props}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10c.92 0 1.76-.31 2.42-.82.48-.36.19-1.18-.42-1.18H12c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8c0 .34-.02.66-.06.98-.1.75.75 1.18 1.32.71C21.09 14.18 22 12.92 22 11.5 22 6.47 17.52 2 12 2z" /></BaseIcon>
);

export const Bell = (props: IconProps) => (
    <BaseIcon {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></BaseIcon>
);

export const Smartphone = (props: IconProps) => (
    <BaseIcon {...props}><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></BaseIcon>
);

export const Store = (props: IconProps) => (
    <BaseIcon {...props}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></BaseIcon>
);

// Additional icons for ProductList
export const Edit = (props: IconProps) => (
    <BaseIcon {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></BaseIcon>
);

export const Trash2 = (props: IconProps) => (
    <BaseIcon {...props}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></BaseIcon>
);

export const Download = (props: IconProps) => (
    <BaseIcon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></BaseIcon>
);

export const Upload = (props: IconProps) => (
    <BaseIcon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></BaseIcon>
);

export const Calendar = (props: IconProps) => (
    <BaseIcon {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></BaseIcon>
);

export const DollarSign = (props: IconProps) => (
    <BaseIcon {...props}><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></BaseIcon>
);

export const ArrowUpRight = (props: IconProps) => (
    <BaseIcon {...props}><path d="M7 7h10v10" /><path d="M7 17 17 7" /></BaseIcon>
);

export const ArrowDownRight = (props: IconProps) => (
    <BaseIcon {...props}><path d="m7 7 10 10" /><path d="M17 7v10H7" /></BaseIcon>
);

export const Globe = (props: IconProps) => (
    <BaseIcon {...props}><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></BaseIcon>
);

export const MousePointer2 = (props: IconProps) => (
    <BaseIcon {...props}><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="m13 13 6 6" /></BaseIcon>
);

export const Check = (props: IconProps) => (
    <BaseIcon {...props}><path d="M20 6 9 17l-5-5" /></BaseIcon>
);
