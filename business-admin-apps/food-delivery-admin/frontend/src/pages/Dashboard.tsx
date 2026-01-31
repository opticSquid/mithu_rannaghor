import { createSignal, onMount, For } from 'solid-js';
import axios from 'axios';
import { User, DashboardStats } from '../types';
import { Users, ArrowDownCircle, ArrowUpCircle, IndianRupee } from 'lucide-solid';

const Dashboard = () => {
    const [users, setUsers] = createSignal<User[]>([]);
    const [stats, setStats] = createSignal<DashboardStats | null>(null);

    onMount(async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                axios.get('/api/users'),
                axios.get('/api/dashboard/stats')
            ]);
            setUsers(usersRes.data || []);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        }
    });

    return (
        <div class="space-y-8 animate-in fade-in duration-700">
            <header>
                <h2 class="text-3xl font-bold text-white">Dashboard</h2>
                <p class="text-text-dim mt-2">Welcome back to Ranjitar Rannaghor Admin</p>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    label="Active Customers"
                    value={stats()?.active_customers.toString() || '0'}
                    trend="Total Subscribers"
                    color="from-blue-500 to-cyan-400"
                />
                <StatCard
                    icon={ArrowUpCircle}
                    label="Monthly Revenue"
                    value={`₹${stats()?.monthly_revenue.toLocaleString('en-IN') || '0'}`}
                    trend="This Month"
                    color="from-emerald-500 to-teal-400"
                />
                <StatCard
                    icon={ArrowDownCircle}
                    label="Monthly Expenses"
                    value={`₹${stats()?.monthly_expenses.toLocaleString('en-IN') || '0'}`}
                    trend="This Month"
                    color="from-rose-500 to-orange-400"
                />
                <StatCard
                    icon={IndianRupee}
                    label="Net Profit"
                    value={`₹${stats()?.net_profit.toLocaleString('en-IN') || '0'}`}
                    trend="All Time"
                    color="from-purple-500 to-indigo-400"
                />
            </div>

            <div class="glass p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold">Recent Customers</h3>
                    <button class="text-primary hover:underline font-medium">View All</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="text-text-dim border-b border-surface-border">
                                <th class="pb-4 font-semibold uppercase text-xs tracking-wider">Name</th>
                                <th class="pb-4 font-semibold uppercase text-xs tracking-wider">Plan</th>
                                <th class="pb-4 font-semibold uppercase text-xs tracking-wider">Wallet Balance</th>
                                <th class="pb-4 font-semibold uppercase text-xs tracking-wider">Location</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-surface-border">
                            <For each={users().slice(0, 5)}>
                                {(user) => (
                                    <tr class="hover:bg-white/5 transition-colors">
                                        <td class="py-4 font-medium">{user.name}</td>
                                        <td class="py-4 capitalize">
                                            <span class={`px-2 py-1 rounded-full text-xs ${user.plan === 'monthly' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                {user.plan}
                                            </span>
                                        </td>
                                        <td class="py-4">
                                            <span class={user.balance < 0 ? 'text-error' : 'text-success'}>
                                                ₹{user.balance.toFixed(2)}
                                            </span>
                                        </td>
                                        <td class="py-4 text-text-dim text-sm">{user.building_no}, {user.room_no}</td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = (props: { icon: any; label: string; value: string; trend: string; color: string }) => (
    <div class="glass p-6 card relative overflow-hidden group">
        <div class={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${props.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}></div>
        <div class="flex items-start justify-between">
            <div>
                <p class="text-text-dim font-medium text-sm">{props.label}</p>
                <h4 class="text-2xl font-bold mt-1 text-white">{props.value}</h4>
            </div>
            <div class={`p-3 rounded-xl bg-gradient-to-br ${props.color} shadow-lg shadow-primary-glow/20`}>
                <props.icon size={20} class="text-white" />
            </div>
        </div>
        <div class="mt-4 flex items-center gap-1 text-xs font-medium text-success">
            <span>{props.trend}</span>
        </div>
    </div>
);

export default Dashboard;
