import { createSignal, onMount, For } from 'solid-js';
import axios from 'axios';
import { User } from '../types';
import { Check, Utensils, Moon, Sun, ChefHat, Salad } from 'lucide-solid';

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
        <div class="max-w-xl mx-auto py-8 animate-in slide-in-from-bottom">
            <header class="mb-8 text-center">
                <h2 class="text-4xl font-black text-[var(--md-sys-color-primary)] tracking-tight">Daily Entry</h2>
                <p class="text-[var(--md-sys-color-on-surface-variant)] mt-2 text-lg">Record today's consumption</p>
            </header>

            <form onSubmit={handleSubmit} class="md-card flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                {/* Decorative background element */}
                <div class="absolute top-0 right-0 w-64 h-64 bg-[var(--md-sys-color-primary)] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                {/* Date & Shift Group */}
                <div class="flex gap-4">
                    <div class="flex-1">
                        <label class="text-xs font-bold text-[var(--md-sys-color-primary)] ml-4 mb-1 block tracking-wider uppercase">Date</label>
                        <input
                            type="date"
                            class="input-filled"
                            value={date()}
                            onInput={e => setDate(e.currentTarget.value)}
                        />
                    </div>
                    <div class="flex-1">
                        <label class="text-xs font-bold text-[var(--md-sys-color-primary)] ml-4 mb-1 block tracking-wider uppercase">Shift</label>
                        <div class="bg-[var(--md-sys-color-surface-container-highest)] rounded-full p-1 flex h-[56px] items-center">
                            <button
                                type="button"
                                onClick={() => setMealType('lunch')}
                                class={`flex-1 h-full rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all ${mealType() === 'lunch' ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md' : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-white/5'}`}
                            >
                                <Sun size={16} /> Lunch
                            </button>
                            <button
                                type="button"
                                onClick={() => setMealType('dinner')}
                                class={`flex-1 h-full rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all ${mealType() === 'dinner' ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md' : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-white/5'}`}
                            >
                                <Moon size={16} /> Dinner
                            </button>
                        </div>
                    </div>
                </div>

                {/* Customer Select */}
                <div>
                    <label class="text-xs font-bold text-[var(--md-sys-color-primary)] ml-4 mb-1 block tracking-wider uppercase">Customer</label>
                    <div class="relative">
                        <select
                            class="input-filled appearance-none cursor-pointer"
                            required
                            value={selectedUser()}
                            onInput={e => setSelectedUser(e.currentTarget.value)}
                        >
                            <option value="">Select a customer...</option>
                            <For each={users()}>
                                {(user) => (
                                    <option value={user.user_id}>
                                        {user.name} • {user.role === 'admin' ? 'Admin' : 'User'} • ₹{user.balance.toFixed(0)}
                                    </option>
                                )}
                            </For>
                        </select>
                        <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--md-sys-color-on-surface-variant)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                    </div>
                </div>

                {/* Meal Selection Cards */}
                <div>
                    <label class="text-xs font-bold text-[var(--md-sys-color-primary)] ml-4 mb-3 block tracking-wider uppercase">Meal Type</label>
                    <div class="grid grid-cols-3 gap-3">
                        {/* Standard */}
                        <label class={`relative flex flex-col items-center p-4 rounded-[20px] cursor-pointer transition-all duration-300 border-2 ${mealCategory() === 'standard'
                            ? 'bg-[var(--md-sys-color-secondary-container)] border-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                            : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                            }`}>
                            <input type="radio" name="cat" class="hidden" checked={mealCategory() === 'standard'} onChange={() => setMealCategory('standard')} />
                            <Utensils size={24} class="mb-2" />
                            <span class="text-sm font-bold">Standard</span>
                            <span class="text-[10px] opacity-80 mt-1">₹52.5</span>
                        </label>

                        {/* Special */}
                        <label class={`relative flex flex-col items-center p-4 rounded-[20px] cursor-pointer transition-all duration-300 border-2 ${mealCategory() === 'special'
                            ? 'bg-[var(--md-sys-color-tertiary-container)] border-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]'
                            : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                            }`}>
                            <input type="radio" name="cat" class="hidden" checked={mealCategory() === 'special'} onChange={() => setMealCategory('special')} />
                            <ChefHat size={24} class="mb-2" />
                            <span class="text-sm font-bold">Special</span>
                            <span class="text-[10px] opacity-80 mt-1">₹120.0</span>
                        </label>

                        {/* None */}
                        <label class={`relative flex flex-col items-center p-4 rounded-[20px] cursor-pointer transition-all duration-300 border-2 ${mealCategory() === 'none'
                            ? 'bg-[var(--md-sys-color-surface-variant)] border-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-on-surface)]'
                            : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                            }`}>
                            <input type="radio" name="cat" class="hidden" checked={mealCategory() === 'none'} onChange={() => setMealCategory('none')} />
                            <Salad size={24} class="mb-2" />
                            <span class="text-sm font-bold">A La Carte</span>
                            <span class="text-[10px] opacity-80 mt-1">Extras Only</span>
                        </label>
                    </div>
                </div>

                {/* Special Dish Input */}
                {mealCategory() === 'special' && (
                    <div class="animate-in fade-in slide-in-from-bottom duration-300">
                        <label class="text-xs font-bold text-[var(--md-sys-color-tertiary)] ml-4 mb-1 block tracking-wider uppercase">Dish Name</label>
                        <input
                            class="input-filled !border-b-[var(--md-sys-color-tertiary)]" // Override border color for tertiary feel
                            placeholder="e.g. Mutton Curry..."
                            required
                            value={specialDish()}
                            onInput={e => setSpecialDish(e.currentTarget.value)}
                        />
                    </div>
                )}

                {/* Extras */}
                <div class="pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                    <h4 class="text-sm font-bold text-[var(--md-sys-color-on-surface-variant)] mb-4 uppercase tracking-wider ml-4">Extras</h4>
                    <div class="grid grid-cols-2 gap-4">
                        {/* Rice */}
                        <div class="bg-[var(--md-sys-color-surface-container-high)] p-4 rounded-2xl flex flex-col items-center">
                            <span class="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">Extra Rice (₹10)</span>
                            <div class="flex items-center gap-4">
                                <button type="button" onClick={() => setExtraRice(Math.max(0, extraRice() - 1))} class="w-10 h-10 rounded-full bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] transition-colors flex items-center justify-center font-bold text-xl">-</button>
                                <span class="text-xl font-bold w-6 text-center">{extraRice()}</span>
                                <button type="button" onClick={() => setExtraRice(extraRice() + 1)} class="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-colors flex items-center justify-center font-bold text-xl">+</button>
                            </div>
                        </div>
                        {/* Roti */}
                        <div class="bg-[var(--md-sys-color-surface-container-high)] p-4 rounded-2xl flex flex-col items-center">
                            <span class="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">Extra Roti (₹4)</span>
                            <div class="flex items-center gap-4">
                                <button type="button" onClick={() => setExtraRoti(Math.max(0, extraRoti() - 1))} class="w-10 h-10 rounded-full bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-primary-container)] hover:text-[var(--md-sys-color-on-primary-container)] transition-colors flex items-center justify-center font-bold text-xl">-</button>
                                <span class="text-xl font-bold w-6 text-center">{extraRoti()}</span>
                                <button type="button" onClick={() => setExtraRoti(extraRoti() + 1)} class="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-colors flex items-center justify-center font-bold text-xl">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting()}
                        class={`btn-primary w-full h-14 text-lg rounded-[20px] relative overflow-hidden group ${isSubmitting() ? 'opacity-50' : ''}`}
                    >
                        <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span class="relative flex items-center gap-2">
                            {isSubmitting() ? 'Recording...' : <><Check size={20} class="stroke-[3]" /> Record Entry</>}
                        </span>
                    </button>
                </div>
            </form>

            <div class={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] px-6 py-3 rounded-full shadow-xl flex items-center gap-3 transition-all duration-300 ${successMsg() ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <div class="bg-[#10b981] rounded-full p-1"><Check size={16} class="text-black" /></div>
                <span class="font-medium">Meal recorded successfully</span>
            </div>
        </div>
    );
};

export default DailyEntry;
