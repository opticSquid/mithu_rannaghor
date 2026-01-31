/* render from src/index.tsx */
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import App from './App';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import DailyEntry from './pages/DailyEntry';
import Billing from './pages/Billing';
import './index.css';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
    throw new Error(
        'Root element not found. Did you forget to add it to your index.html? Or is the id misspelled?',
    );
}

render(
    () => (
        <Router root={App}>
            <Route path="/" component={Dashboard} />
            <Route path="/customers" component={Customers} />
            <Route path="/daily-entry" component={DailyEntry} />
            <Route path="/billing" component={Billing} />
        </Router>
    ),
    root!,
);
