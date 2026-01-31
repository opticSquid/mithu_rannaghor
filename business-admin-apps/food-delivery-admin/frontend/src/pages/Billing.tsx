import { createSignal, onMount, For, Show } from 'solid-js';
import axios from 'axios';
import { User, BillReport } from '../types';
import { Download, FileText, Calendar, Search } from 'lucide-solid';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const Billing = () => {
    const [users, setUsers] = createSignal<User[]>([]);
    const [selectedUser, setSelectedUser] = createSignal<string>('');
    const [startDate, setStartDate] = createSignal(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = createSignal(new Date().toISOString().split('T')[0]);
    const [report, setReport] = createSignal<BillReport | null>(null);
    const [isLoading, setIsLoading] = createSignal(false);

    onMount(async () => {
        const res = await axios.get('/api/users');
        setUsers(res.data || []);
    });

    const generateReport = async () => {
        if (!selectedUser()) return;
        setIsLoading(true);
        try {
            const res = await axios.get(`/api/reports/bill?user_id=${selectedUser()}&start_date=${startDate()}&end_date=${endDate()}`);
            setReport(res.data);
        } catch (err) {
            alert('Failed to generate report');
        } finally {
            setIsLoading(false);
        }
    };

    const exportPDF = async () => {
        const element = document.getElementById('bill-content');
        if (!element) return;

        // Ensure we are at the top of the element to capture it fully
        const originalScroll = window.scrollY;
        window.scrollTo(0, 0);

        // Wait a bit to ensure any animations or renders are finished
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: true,
                useCORS: true,
                allowTaint: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('bill-content');
                    if (clonedElement) {
                        clonedElement.style.transform = 'none';
                        clonedElement.style.animation = 'none';
                        clonedElement.style.opacity = '1';
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${report()?.user.name}_${startDate()}_to_${endDate()}.pdf`);
            console.log('PDF exported successfully');
        } catch (err) {
            console.error('PDF Export Error:', err);
            alert('Failed to export PDF. Check console for details.');
        } finally {
            window.scrollTo(0, originalScroll);
        }
    };

    return (
        <div class="space-y-8 animate-in fade-in duration-700">
            <header>
                <h2 class="text-3xl font-bold text-white">Billing & Reports</h2>
                <p class="text-text-dim mt-2">Generate and export customer invoices</p>
            </header>

            <div class="glass p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div class="md:col-span-1">
                    <label class="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">Customer</label>
                    <select
                        class="input bg-surface"
                        value={selectedUser()}
                        onInput={e => setSelectedUser(e.currentTarget.value)}
                    >
                        <option value="">Select customer...</option>
                        <For each={users()}>
                            {(user) => <option value={user.user_id}>{user.name}</option>}
                        </For>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">From</label>
                    <input
                        type="date"
                        class="input"
                        value={startDate()}
                        onInput={e => setStartDate(e.currentTarget.value)}
                    />
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-widest text-text-dim mb-2">To</label>
                    <input
                        type="date"
                        class="input"
                        value={endDate()}
                        onInput={e => setEndDate(e.currentTarget.value)}
                    />
                </div>
                <button
                    onClick={generateReport}
                    disabled={isLoading() || !selectedUser()}
                    class="btn btn-primary w-full h-[46px]"
                >
                    {isLoading() ? 'Generating...' : 'Generate Bill'}
                </button>
            </div>

            <Show when={report()}>
                <div class="animate-in slide-in-from-bottom duration-500">
                    <div class="flex justify-end mb-4">
                        <button onClick={exportPDF} class="btn bg-white/10 hover:bg-white/20 text-white">
                            <Download size={18} /> Download PDF
                        </button>
                    </div>

                    <div id="bill-content" class="bg-white text-slate-800 p-12 rounded-lg shadow-2xl max-w-4xl mx-auto border border-slate-100">
                        {/* Bill Header */}
                        <div class="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                            <div>
                                <div class="flex items-center gap-3 mb-4">
                                    <div class="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                                        <span class="text-white font-black text-2xl">M</span>
                                    </div>
                                    <h1 class="text-2xl font-black text-indigo-900 tracking-tight">MITHU'S RANNAGHOR</h1>
                                </div>
                                <p class="text-slate-500 text-sm max-w-xs">Home cooked fresh meals delivered to your doorstep. Healthy, hygienic, and tasty.</p>
                            </div>
                            <div class="text-right">
                                <h2 class="text-3xl font-bold text-slate-800 uppercase tracking-tighter">Invoice</h2>
                                <p class="text-slate-400 mt-1 font-medium">#{report()?.user.user_id}-{new Date().getTime().toString().slice(-6)}</p>
                                <div class="mt-4 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block">
                                    {new Date(startDate()).toLocaleDateString()} - {new Date(endDate()).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Bill Info */}
                        <div class="grid grid-cols-2 gap-12 mb-12">
                            <div>
                                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Bill To:</h4>
                                <p class="text-xl font-bold text-slate-800">{report()?.user.name}</p>
                                <p class="text-slate-500">{report()?.user.mobile_no}</p>
                                <p class="text-slate-500 mt-1">{report()?.user.building_no}, {report()?.user.room_no}</p>
                            </div>
                            <div class="text-right">
                                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Summary:</h4>
                                <div class="space-y-1">
                                    <p class="text-slate-500">Opening Balance: <span class="text-slate-800 font-bold">₹{report()?.opening_balance.toFixed(2)}</span></p>
                                    <p class="text-slate-500">Total Billable: <span class="text-slate-800 font-bold">₹{report()?.total_spent.toFixed(2)}</span></p>
                                    <p class="text-slate-500">Recharges: <span class="text-slate-800 font-bold">₹{(report()!.closing_balance - (report()!.opening_balance - report()!.total_spent)).toFixed(2)}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Bill Table */}
                        <table class="w-full mb-12">
                            <thead>
                                <tr class="bg-slate-50 text-slate-500 text-left">
                                    <th class="py-3 px-4 font-bold text-xs uppercase tracking-wider">Date</th>
                                    <th class="py-3 px-4 font-bold text-xs uppercase tracking-wider">Meal</th>
                                    <th class="py-3 px-4 font-bold text-xs uppercase tracking-wider">Details</th>
                                    <th class="py-3 px-4 font-bold text-xs uppercase tracking-wider text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <For each={report()?.logs}>
                                    {(log) => (
                                        <tr class="text-slate-800">
                                            <td class="py-4 px-4 text-sm">{new Date(log.log_date).toLocaleDateString()}</td>
                                            <td class="py-4 px-4 text-sm font-semibold capitalize">{log.meal_type}</td>
                                            <td class="py-4 px-4 text-sm">
                                                {log.has_main_meal ? (
                                                    log.is_special ? (
                                                        <span class="font-bold text-indigo-600">{log.special_dish_name} (S) </span>
                                                    ) : (
                                                        'Standard '
                                                    )
                                                ) : (
                                                    <span class="text-slate-500 italic font-medium">A La Carte </span>
                                                )}
                                                {log.extra_rice_qty > 0 && <span class="text-slate-400">+ Rice ({log.extra_rice_qty}) </span>}
                                                {log.extra_roti_qty > 0 && <span class="text-slate-400">+ Roti ({log.extra_roti_qty}) </span>}
                                            </td>
                                            <td class="py-4 px-4 text-sm font-bold text-right">₹{log.total_cost.toFixed(2)}</td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>

                        {/* Bill Totals */}
                        <div class="flex justify-end pt-8 border-t-2 border-slate-100">
                            <div class="w-64 space-y-4">
                                <div class="flex justify-between text-slate-500 font-medium">
                                    <span>Subtotal</span>
                                    <span>₹{report()?.total_spent.toFixed(2)}</span>
                                </div>
                                <div class="flex justify-between text-2xl font-black text-indigo-900 border-t border-slate-100 pt-4">
                                    <span>Total</span>
                                    <span>₹{report()?.total_spent.toFixed(2)}</span>
                                </div>
                                <div class={`p-4 rounded-xl mt-4 flex justify-between ${report()!.closing_balance < 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                    <span class="text-xs font-bold uppercase">Balance Status</span>
                                    <span class="font-bold">₹{report()?.closing_balance.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-20 text-center border-t border-slate-100 pt-8 opacity-40 grayscale">
                            <p class="text-xs font-bold uppercase tracking-[0.2em] mb-2 text-slate-400">Generated via Mithu's Rannaghor Admin Panel</p>
                            <p class="text-[10px] text-slate-400">Thank you for Choosing Home Cooked Goodness.</p>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
};

export default Billing;
