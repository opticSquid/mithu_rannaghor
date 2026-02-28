import { A, useLocation } from '@solidjs/router';
import {
    FileText,
    LayoutDashboard,
    PlusCircle,
    Users,
    BarChart3,
    Wallet
} from 'lucide-solid';
import { type ParentComponent, For } from 'solid-js';

const App: ParentComponent = (props) => {
    const location = useLocation();

    const navItems = [
        { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/customers', icon: Users, label: 'Customers' },
        { href: '/daily-entry', icon: PlusCircle, label: 'Daily Entry' },
        { href: '/billing', icon: FileText, label: 'Generate Bill' },
        { href: '/expenses', icon: Wallet, label: 'Expenses' },
        { href: '/analytics', icon: BarChart3, label: 'Analytics' }
    ];

    return (
        <div class="flex h-screen bg-transparent flex-col md:flex-row">
            {/* Sidebar (Desktop) */}
            <aside class="w-64 glass m-4 border-none shadow-2xl hidden md:flex flex-col">
                <div class="p-8">
                    <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                    <p class="text-xs text-text-dim mt-1">Rajitar Rannaghor</p>
                </div>

                <nav class="flex-1 px-4 space-y-2">
                    <For each={navItems}>
                        {(item) => (
                            <NavItem href={item.href} icon={item.icon} label={item.label} active={location.pathname === item.href} />
                        )}
                    </For>
                </nav>

                <div class="p-4 border-t border-surface-border">
                    <div class="flex items-center gap-3 p-3 glass bg-white/5 rounded-xl">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold">
                            A
                        </div>
                        <div>
                            <p class="text-sm font-semibold">Admin</p>
                            <p class="text-xs text-text-dim">Ranjitar Rannaghor</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main class="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                {props.children}
            </main>

            {/* Bottom Navigation (Mobile) */}
            <nav class="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-surface-border flex justify-around items-center p-2 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)] z-50">
                <For each={navItems}>
                    {(item) => (
                        <MobileNavItem href={item.href} icon={item.icon} label={item.label} active={location.pathname === item.href} />
                    )}
                </For>
            </nav>
        </div>
    );
};

const NavItem = (props: { href: string; icon: any; label: string; active: boolean }) => (
    <A
        href={props.href}
        class={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${props.active
            ? 'bg-primary text-white shadow-lg shadow-primary-glow'
            : 'hover:bg-white/10 text-text-dim hover:text-white'
            }`}
    >
        <props.icon size={20} />
        <span class="font-medium">{props.label}</span>
    </A>
);

const MobileNavItem = (props: { href: string; icon: any; label: string; active: boolean }) => (
    <A
        href={props.href}
        class={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[64px] transition-all ${props.active
            ? 'text-primary'
            : 'text-text-dim hover:text-white hover:bg-white/5'
            }`}
    >
        <div class={`p-1.5 rounded-xl mb-1 ${props.active ? 'bg-primary/20' : ''}`}>
            <props.icon size={20} class={props.active ? 'stroke-[2.5]' : ''} />
        </div>
        <span class="text-[10px] font-medium leading-none">{props.label}</span>
    </A>
);

export default App;
