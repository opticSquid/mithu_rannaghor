import { createSignal, onMount, For } from 'solid-js';
import axios from 'axios';
import { User } from '../types';
import { Plus, Search, Wallet as WalletIcon } from 'lucide-solid';

const Customers = () => {
    const [users, setUsers] = createSignal<User[]>([]);
    const [searchTerm, setSearchTerm] = createSignal('');
    const [showAddModal, setShowAddModal] = createSignal(false);
    const [showRechargeModal, setShowRechargeModal] = createSignal<User | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    onMount(fetchUsers);

    const filteredUsers = () => users().filter(u =>
        u.name.toLowerCase().includes(searchTerm().toLowerCase()) ||
        u.mobile_no.includes(searchTerm())
    );

    return (
        <div class="space-y-8 animate-in slide-in-from-bottom duration-500">
            <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-3xl font-bold text-white">Customers</h2>
                    <p class="text-text-dim mt-2">Manage your subscribers and their balances</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    class="btn btn-primary"
                >
                    <Plus size={20} /> Add New Customer
                </button>
            </header>

            <div class="flex items-center gap-4 glass p-4 bg-white/5 border-none">
                <Search size={20} class="text-text-dim ml-2" />
                <input
                    type="text"
                    placeholder="Search customers by name or phone..."
                    class="bg-transparent border-none outline-none text-white w-full placeholder:text-text-dim"
                    onInput={(e) => setSearchTerm(e.currentTarget.value)}
                />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <For each={filteredUsers()}>
                    {(user) => (
                        <div class="glass p-6 card border-white/5 hover:border-primary/50 group">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg">
                                    {user.name[0]}
                                </div>
                                <div>
                                    <h4 class="font-bold text-lg group-hover:text-primary transition-colors">{user.name}</h4>
                                    <p class="text-text-dim text-sm">{user.mobile_no}</p>
                                </div>
                            </div>

                            <div class="space-y-3 pt-4 border-t border-white/5">
                                <div class="flex justify-between text-sm">
                                    <span class="text-text-dim">Location</span>
                                    <span>{user.building_no}, {user.room_no}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-text-dim">Plan</span>
                                    <span class="capitalize text-accent font-medium">{user.plan}</span>
                                </div>
                                <div class="flex justify-between items-center bg-white/5 p-3 rounded-xl mt-4">
                                    <span class="text-xs font-semibold uppercase tracking-wider text-text-dim">Wallet</span>
                                    <span class={`text-lg font-bold ${user.balance < 0 ? 'text-error' : 'text-success'}`}>
                                        ₹{user.balance.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div class="mt-6 flex gap-2">
                                <button
                                    onClick={() => setShowRechargeModal(user)}
                                    class="flex-1 btn bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center justify-center gap-2"
                                >
                                    <WalletIcon size={18} /> Recharge
                                </button>
                            </div>
                        </div>
                    )}
                </For>
            </div>

            {/* Add User Modal */}
            {showAddModal() && (
                <Modal title="Add New Customer" onClose={() => setShowAddModal(false)}>
                    <AddUserForm onSuccess={() => { setShowAddModal(false); fetchUsers(); }} />
                </Modal>
            )}

            {/* Recharge Modal */}
            {showRechargeModal() && (
                <Modal title={`Recharge Wallet: ${showRechargeModal()?.name}`} onClose={() => setShowRechargeModal(null)}>
                    <RechargeForm user={showRechargeModal()!} onSuccess={() => { setShowRechargeModal(null); fetchUsers(); }} />
                </Modal>
            )}
        </div>
    );
};

const Modal = (props: { title: string; children: any; onClose: () => void }) => (
    <div class="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div class="glass w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold">{props.title}</h3>
                <button onClick={props.onClose} class="text-text-dim hover:text-white">&times;</button>
            </div>
            {props.children}
        </div>
    </div>
);

const AddUserForm = (props: { onSuccess: () => void }) => {
    const [formData, setFormData] = createSignal({
        name: '',
        mobile_no: '',
        building_no: '',
        room_no: '',
        plan: 'monthly' as const
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        try {
            await axios.post('/api/users', formData());
            props.onSuccess();
        } catch (err) {
            alert('Failed to add customer');
        }
    };

    return (
        <form onSubmit={handleSubmit} class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-text-dim mb-1">Full Name</label>
                <input
                    class="input"
                    required
                    onInput={e => setFormData({ ...formData(), name: e.currentTarget.value })}
                />
            </div>
            <div>
                <label class="block text-sm font-medium text-text-dim mb-1">Mobile Number</label>
                <input
                    class="input"
                    required
                    onInput={e => setFormData({ ...formData(), mobile_no: e.currentTarget.value })}
                />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-text-dim mb-1">Building No</label>
                    <input
                        class="input"
                        required
                        onInput={e => setFormData({ ...formData(), building_no: e.currentTarget.value })}
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-dim mb-1">Room No</label>
                    <input
                        class="input"
                        required
                        onInput={e => setFormData({ ...formData(), room_no: e.currentTarget.value })}
                    />
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-text-dim mb-1">Plan Type</label>
                <select
                    class="input bg-surface"
                    onInput={e => setFormData({ ...formData(), plan: e.currentTarget.value as any })}
                >
                    <option value="monthly">Monthly</option>
                    <option value="one_off">One-off</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary w-full mt-4">Save Customer</button>
        </form>
    );
};

const RechargeForm = (props: { user: User; onSuccess: () => void }) => {
    const [amount, setAmount] = createSignal('');
    const [refId, setRefId] = createSignal('');

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        try {
            await axios.post('/api/wallet/recharge', {
                user_id: props.user.user_id,
                amount: parseFloat(amount()),
                ref_id: refId()
            });
            props.onSuccess();
        } catch (err) {
            alert('Failed to recharge');
        }
    };

    return (
        <form onSubmit={handleSubmit} class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-text-dim mb-1">Amount (₹)</label>
                <input
                    type="number"
                    class="input text-2xl font-bold"
                    required
                    onInput={e => setAmount(e.currentTarget.value)}
                />
            </div>
            <div>
                <label class="block text-sm font-medium text-text-dim mb-1">Payment Reference (UPI/UTR)</label>
                <input
                    class="input"
                    required
                    placeholder="Optional"
                    onInput={e => setRefId(e.currentTarget.value)}
                />
            </div>
            <button type="submit" class="btn btn-primary w-full mt-4">Confirm Recharge</button>
        </form>
    );
};

export default Customers;
