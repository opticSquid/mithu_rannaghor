import { A, useLocation } from '@solidjs/router';
import {
    FileText,
    LayoutDashboard,
    PlusCircle,
    Users,
    BarChart3,
    Wallet
} from 'lucide-solid';
import { type ParentComponent } from 'solid-js';

const App: ParentComponent = (props) => {
    const location = useLocation();

    return (
        <div class="flex h-screen bg-transparent">
            {/* Sidebar */}
            <aside class="w-64 glass m-4 border-none shadow-2xl flex flex-col">
                <div class="p-8">
                    <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                    <p class="text-xs text-text-dim mt-1">Rajitar Rannaghor</p>
                </div>

                <nav class="flex-1 px-4 space-y-2">
                    <NavItem href="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
                    <NavItem href="/customers" icon={Users} label="Customers" active={location.pathname === '/customers'} />
                    <NavItem href="/daily-entry" icon={PlusCircle} label="Daily Entry" active={location.pathname === '/daily-entry'} />
                    <NavItem href="/billing" icon={FileText} label="Generate Bill" active={location.pathname === '/billing'} />
                    <NavItem href="/expenses" icon={Wallet} label="Expenses" active={location.pathname === '/expenses'} />
                    <NavItem href="/analytics" icon={BarChart3} label="Analytics" active={location.pathname === '/analytics'} />
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
            <main class="flex-1 p-8 overflow-y-auto">
                {props.children}
            </main>
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

export default App;
