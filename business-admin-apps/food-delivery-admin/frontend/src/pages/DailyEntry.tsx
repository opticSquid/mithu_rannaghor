import { createSignal, onMount, For } from 'solid-js';
import axios from 'axios';
import { User } from '../types';
import { Check, Info } from 'lucide-solid';

const DailyEntry = () => {
    const [users, setUsers] = createSignal<User[]>([]);
    const [selectedUser, setSelectedUser] = createSignal<string>('');
    const [date, setDate] = createSignal(new Date().toISOString().split('T')[0]);
    const [mealType, setMealType] = createSignal<'lunch' | 'dinner'>('lunch');
    const [mealCategory, setMealCategory] = createSignal<'standard' | 'special' | 'none'>('standard');
    const [specialDish, setSpecialDish] = createSignal('');
    const [extraRice, setExtraRice] = createSignal(0);
    const [extraRoti, setExtraRoti] = createSignal(0);
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [successMsg, setSuccessMsg] = createSignal(false);

    onMount(async () => {
        const res = await axios.get('/api/users');
        setUsers(res.data || []);
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!selectedUser()) return;

        setIsSubmitting(true);
        try {
            await axios.post('/api/daily-entry', {
                user_id: parseInt(selectedUser()),
                log_date: new Date(date()).toISOString(),
                meal_type: mealType(),
                has_main_meal: mealCategory() !== 'none',
                is_special: mealCategory() === 'special',
                special_dish_name: mealCategory() === 'special' ? specialDish() : '',
                extra_rice_qty: extraRice(),
                extra_roti_qty: extraRoti()
            });
            setSuccessMsg(true);
            setTimeout(() => setSuccessMsg(false), 3000);

            // Reset some fields
            setMealCategory('standard');
            setSpecialDish('');
            setExtraRice(0);
            setExtraRoti(0);
        } catch (err) {
            alert('Failed to record entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div class="max-w-2xl mx-auto animate-in slide-in-from-right duration-500">
            <header class="mb-8">
                <h2 class="text-3xl font-bold text-white">Daily Entry</h2>
                <p class="text-text-dim mt-2">Record meal consumption for today</p>
            </header>

            <form onSubmit={handleSubmit} class="glass p-8 space-y-6">
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-text-dim mb-2 text-xs uppercase tracking-wider">Date</label>
                            <input
                                type="date"
                                class="input"
                                value={date()}
                                onInput={e => setDate(e.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-text-dim mb-2 text-xs uppercase tracking-wider">Shift</label>
                            <div class="flex bg-white/5 rounded-xl p-1 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setMealType('lunch')}
                                    class={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${mealType() === 'lunch' ? 'bg-primary text-white shadow-lg shadow-primary-glow/20' : 'text-text-dim hover:text-white'}`}
                                >
                                    Lunch
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMealType('dinner')}
                                    class={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${mealType() === 'dinner' ? 'bg-primary text-white shadow-lg shadow-primary-glow/20' : 'text-text-dim hover:text-white'}`}
                                >
                                    Dinner
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-text-dim mb-2 text-xs uppercase tracking-wider">Customer</label>
                        <select
                            class="input bg-surface"
                            required
                            value={selectedUser()}
                            onInput={e => setSelectedUser(e.currentTarget.value)}
                        >
                            <option value="">Select a customer...</option>
                            <For each={users()}>
                                {(user) => (
                                    <option value={user.user_id}>
                                        {user.name} ({user.mobile_no} / ₹{user.balance.toFixed(2)})
                                    </option>
                                )}
                            </For>
                        </select>
                    </div>

                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-text-dim mb-2 text-xs uppercase tracking-wider">Meal Selection</label>
                        <div class="grid grid-cols-3 gap-3">
                            <label
                                class={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${mealCategory() === 'standard' ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary-glow/20' : 'bg-white/5 border-transparent text-text-dim'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    class="hidden"
                                    checked={mealCategory() === 'standard'}
                                    onChange={() => setMealCategory('standard')}
                                />
                                <span class="font-bold text-sm">Standard</span>
                                <span class="text-[10px] opacity-70">₹52.50</span>
                            </label>
                            <label
                                class={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${mealCategory() === 'special' ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-transparent text-text-dim'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    class="hidden"
                                    checked={mealCategory() === 'special'}
                                    onChange={() => setMealCategory('special')}
                                />
                                <span class="font-bold text-sm">Special</span>
                                <span class="text-[10px] opacity-70">₹120.00</span>
                            </label>
                            <label
                                class={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${mealCategory() === 'none' ? 'bg-slate-500/20 border-slate-500 text-white shadow-lg shadow-slate-500/20' : 'bg-white/5 border-transparent text-text-dim'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="category"
                                    class="hidden"
                                    checked={mealCategory() === 'none'}
                                    onChange={() => setMealCategory('none')}
                                />
                                <span class="font-bold text-sm">None</span>
                                <span class="text-[10px] opacity-70">Extras only</span>
                            </label>
                        </div>
                    </div>
                </div>

                {mealCategory() === 'special' && (
                    <div class="space-y-4 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label class="block text-xs font-bold text-primary uppercase tracking-widest mb-2">Special Dish Name</label>
                        <input
                            class="input"
                            placeholder="e.g. Mutton Curry, Fish Special..."
                            required
                            value={specialDish()}
                            onInput={e => setSpecialDish(e.currentTarget.value)}
                        />
                    </div>
                )}

                <div class="space-y-4 pt-6 border-t border-white/5">
                    <h4 class="font-bold mb-4">A La Carte Items</h4>
                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-sm text-text-dim">Extra Rice (₹10/plate)</label>
                            <div class="flex items-center gap-3">
                                <button type="button" onClick={() => setExtraRice(Math.max(0, extraRice() - 1))} class="w-10 h-10 glass rounded-lg flex items-center justify-center">-</button>
                                <span class="w-8 text-center font-bold text-lg">{extraRice()}</span>
                                <button type="button" onClick={() => setExtraRice(extraRice() + 1)} class="w-10 h-10 glass rounded-lg flex items-center justify-center">+</button>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm text-text-dim">Extra Roti (₹4/piece)</label>
                            <div class="flex items-center gap-3">
                                <button type="button" onClick={() => setExtraRoti(Math.max(0, extraRoti() - 1))} class="w-10 h-10 glass rounded-lg flex items-center justify-center">-</button>
                                <span class="w-8 text-center font-bold text-lg">{extraRoti()}</span>
                                <button type="button" onClick={() => setExtraRoti(extraRoti() + 1)} class="w-10 h-10 glass rounded-lg flex items-center justify-center">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting()}
                    class={`btn btn-primary w-full mt-8 py-4 text-lg ${isSubmitting() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSubmitting() ? 'Recording...' : 'Record Meal'}
                </button>

                {successMsg() && (
                    <div class="mt-4 p-4 bg-success/20 border border-success/30 rounded-xl text-success flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                        <Check size={20} />
                        Entry recorded successfully!
                    </div>
                )}
            </form>
        </div>
    );
};

export default DailyEntry;
