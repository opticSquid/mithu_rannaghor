import { createSignal, createContext, useContext, ParentComponent } from 'solid-js';
import { dict, Locale, RawDictionary } from './dict';

type I18nContextType = {
    locale: () => Locale;
    setLocale: (loc: Locale) => void;
    t: (key: keyof RawDictionary) => string;
};

const I18nContext = createContext<I18nContextType>();

export const I18nProvider: ParentComponent = (props) => {
    const [locale, setLocale] = createSignal<Locale>('en');

    const t = (key: keyof RawDictionary) => {
        return dict[locale()][key] || key;
    };

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {props.children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) throw new Error("useI18n must be used within I18nProvider");
    return context;
};
