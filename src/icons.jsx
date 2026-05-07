// Lucide-style line icons
const Icon = ({ d, size=20, stroke=2, fill='none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {children || <path d={d}/>}
  </svg>
);

const Icons = {
  Home: (p) => <Icon {...p}><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></Icon>,
  Cart: (p) => <Icon {...p}><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2l2.4 12h11l2-8H6"/></Icon>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 11a3 3 0 100-6"/><path d="M21 20c0-2.5-1.5-4.6-3.5-5.5"/></Icon>,
  Box: (p) => <Icon {...p}><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></Icon>,
  Sprout: (p) => <Icon {...p}><path d="M12 20v-9"/><path d="M12 11C12 7 8 4 4 5c0 4 3 7 8 7"/><path d="M12 11c0-3 3-6 8-6 0 4-3 6-8 6"/></Icon>,
  Chart: (p) => <Icon {...p}><path d="M3 20h18"/><path d="M6 16v-4"/><path d="M11 16V8"/><path d="M16 16v-6"/><path d="M21 16V6"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Print: (p) => <Icon {...p}><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v7H6z"/></Icon>,
  Save: (p) => <Icon {...p}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></Icon>,
  Trash: (p) => <Icon {...p}><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></Icon>,
  X: (p) => <Icon {...p}><path d="M18 6L6 18M6 6l12 12"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M5 13l4 4L19 7"/></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M18 16l-1.5-2V11a4.5 4.5 0 10-9 0v3L6 16h12z"/><path d="M10 20a2 2 0 004 0"/></Icon>,
  Wallet: (p) => <Icon {...p}><path d="M3 7h16a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><path d="M3 7V5a2 2 0 012-2h12"/><circle cx="17" cy="14" r="1.2"/></Icon>,
  Download: (p) => <Icon {...p}><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></Icon>,
  Star: (p) => <Icon {...p}><path d="M12 3l2.6 5.6 6 .7-4.4 4.2 1.2 6L12 16.8 6.6 19.5l1.2-6L3.4 9.3l6-.7L12 3z"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  Pkg: (p) => <Icon {...p}><path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7L12 12l8.7-5"/><path d="M12 22V12"/></Icon>,
  Folder: (p) => <Icon {...p}><path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"/></Icon>,
};

window.Icons = Icons;
