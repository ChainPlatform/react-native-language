import React from "react";
import * as RNLocalize from "react-native-localize";
import { retrieveStorage as defaultGet, saveStorage as defaultSet } from "@chainplatform/sdk";

/* ---------------- Simple Event Emitter ---------------- */
class SimpleEmitter {
    constructor() { this.handlers = {}; }
    on(event, cb) {
        if (!this.handlers[event]) this.handlers[event] = [];
        this.handlers[event].push(cb);
        return () => this.off(event, cb);
    }
    off(event, cb) {
        if (!this.handlers[event]) return;
        this.handlers[event] = this.handlers[event].filter(fn => fn !== cb);
    }
    emit(event, ...args) {
        (this.handlers[event] || []).forEach(fn => { try { fn(...args); } catch { } });
    }
}

/* ---------------- Language Core ---------------- */
class LanguageManager {
    constructor() {
        this.translations = {};
        this.fallbackLanguage = "en";
        this.currentLanguage = "en";
        this.STORAGE_KEY = "APP_LANGUAGE";
        this.CACHE_KEY_PREFIX = "CPL_CACHE_";
        this.emitter = new SimpleEmitter();
        this.lazyLoadFn = null;
        this.loadFromApiFn = null;
        this.cacheTtl = 24 * 60 * 60 * 1000;
        this.initialized = false;
        this.storage = { get: defaultGet, set: defaultSet };
    }

    normalizeLocale(loc) {
        if (!loc) return "en";
        return String(loc).replace(/_/g, "-").split(/[@]/)[0].toLowerCase();
    }

    detectDeviceLocale() {
        try {
            const locales = RNLocalize.getLocales?.();
            if (Array.isArray(locales) && locales.length > 0) {
                const tag = locales[0].languageTag || locales[0].languageCode;
                return this.normalizeLocale(tag);
            }
        } catch { }
        return "en";
    }

    async init(options = {}) {
        if (this.initialized) return this.currentLanguage;

        this.fallbackLanguage = options.fallback || "en";
        this.translations = options.translations || {};
        this.lazyLoadFn = options.lazyLoad || null;
        this.loadFromApiFn = options.loadFromApi || null;
        this.storage = options.storage || this.storage;

        let lang = options.language;
        if (!lang || !String(lang).trim()) {
            const saved = await this.storage.get(this.STORAGE_KEY);
            lang = saved && String(saved).trim()
                ? this.normalizeLocale(saved)
                : this.detectDeviceLocale();
        }

        await this.loadLanguage(lang);
        this.initialized = true;
        this.emitter.emit("languageChanged", lang);
        return lang;
    }

    async loadLanguage(lang) {
        const translations = await this._fetchLanguage(lang);
        this.translations[lang] = translations || {};
        this.currentLanguage = lang;
        await this.storage.set(this.STORAGE_KEY, lang);
    }

    async _fetchLanguage(lang) {
        if (this.translations[lang]) return this.translations[lang];

        if (this.lazyLoadFn) {
            try {
                const loaded = await this.lazyLoadFn(lang);
                if (loaded) return loaded;
            } catch { }
        }

        if (this.loadFromApiFn) {
            try {
                const res = await this.loadFromApiFn(lang);
                return res || {};
            } catch { }
        }

        return this.translations[this.fallbackLanguage] || {};
    }

    async changeLanguage(lang) {
        await this.loadLanguage(lang);
        this.emitter.emit("languageChanged", lang);
    }

    onLanguageChange(cb) {
        return this.emitter.on("languageChanged", cb);
    }

    t = (key, vars) => {
        const lang = this.currentLanguage || this.fallbackLanguage;
        const dict = this.translations[lang] || {};
        const text = dict[key] || key;
        if (!vars) return text;
        return text.replace(/{([^}]+)}/g, (_, name) =>
            vars[name] === undefined ? `{${name}}` : String(vars[name])
        );
    };

    formatNumber(number, options = {}) {
        try {
            const lang = this.currentLanguage || this.fallbackLanguage;
            return new Intl.NumberFormat(lang, options).format(number);
        } catch (e) {
            return String(number);
        }
    }
}

export const Language = new LanguageManager();

/* ---------------- React Context ---------------- */
export const LanguageContext = React.createContext({
    t: (key) => key,
    language: "en",
    changeLanguage: () => { },
    formatNumber: () => { },
});

/* ---------------- Provider ---------------- */
export class LanguageProvider extends React.Component {
    constructor(props) {
        super(props);
        this.state = { language: Language.currentLanguage };
    }

    async componentDidMount() {
        await Language.init(this.props);
        this.setState({ language: Language.currentLanguage });
        this.unsubscribe = Language.onLanguageChange(lang => this.setState({ language: lang }));
    }

    componentWillUnmount() {
        this.unsubscribe?.();
    }

    render() {
        const ctx = {
            language: this.state.language,
            t: Language.t,
            changeLanguage: Language.changeLanguage.bind(Language),
            formatNumber: Language.formatNumber.bind(Language),
        };
        return (
            <LanguageContext.Provider value={ctx}>
                {this.props.children}
            </LanguageContext.Provider>
        );
    }
}

/* ---------------- HOC auto inject ---------------- */
export function withLanguage(WrappedComponent) {
    return function WithLanguageWrapper(props) {
        return (
            <LanguageContext.Consumer>
                {ctx => (
                    <WrappedComponent
                        {...props}
                        t={ctx.t}
                        language={ctx.language}
                        changeLanguage={ctx.changeLanguage}
                        formatNumber={ctx.formatNumber}
                    />
                )}
            </LanguageContext.Consumer>
        );
    };
}

export default Language;
