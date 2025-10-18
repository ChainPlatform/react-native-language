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
        this.STORAGE_KEY = "USER_LANGUAGE";
        this.emitter = new SimpleEmitter();
        this.lazyLoadFn = null;
        this.loadFromApiFn = null;
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

        // console.log("Language.init() called", { initialized: this.initialized });

        this.fallbackLanguage = options.fallback || "en";
        this.translations = options.translations || {};
        this.lazyLoadFn = options.lazyLoad || null;
        this.loadFromApiFn = options.loadFromApi || null;
        this.storage = options.storage || this.storage;
        this.STORAGE_KEY = options.storage_key || this.STORAGE_KEY;

        let lang = null;
        try {
            const saved = await this.storage.get(this.STORAGE_KEY);
            if (saved && String(saved).trim()) {
                lang = this.normalizeLocale(saved);
            }
        } catch (e) {
            console.warn("Language.init() read storage failed:", e);
        }

        if (!lang) {
            lang = options.language && String(options.language).trim()
                ? this.normalizeLocale(options.language)
                : this.detectDeviceLocale();
        }

        await this.loadLanguage(lang, false);
        this.initialized = true;
        this.emitter.emit("languageChanged", lang);
        return lang;
    }

    async loadLanguage(lang, save = true) {
        const translations = await this._fetchLanguage(lang);
        this.translations[lang] = translations || {};
        this.currentLanguage = lang;
        if (save) {
            try {
                await this.storage.set(this.STORAGE_KEY, lang);
            } catch (e) {
                console.warn("Language.loadLanguage() save failed:", e);
            }
        }
    }

    async _fetchLanguage(lang) {
        if (this.translations[lang]) return this.translations[lang];

        if (this.lazyLoadFn) {
            try {
                const loaded = await this.lazyLoadFn(lang);
                if (loaded) return loaded;
            } catch (e) {
                console.warn("Language.lazyLoad error:", e);
            }
        }

        if (this.loadFromApiFn) {
            try {
                const res = await this.loadFromApiFn(lang);
                return res || {};
            } catch (e) {
                console.warn("Language.loadFromApi error:", e);
            }
        }

        return this.translations[this.fallbackLanguage] || {};
    }

    async changeLanguage(lang) {
        await this.loadLanguage(lang, true);
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
        } catch {
            return String(number);
        }
    }

    format(type, value, options = {}) {
        try {
            if (typeof Intl[type] !== "function") return value;
            const lang = this.currentLanguage || this.fallbackLanguage;
            const formatter = new Intl[type](lang, options);
            if (typeof formatter.format === "function") return formatter.format(value);
            return value;
        } catch {
            return value;
        }
    }
}

if (!global._LANGUAGE_SINGLETON_) {
    global._LANGUAGE_SINGLETON_ = new LanguageManager();
}
export const Language = global._LANGUAGE_SINGLETON_;

/* ---------------- React Context ---------------- */
export const LanguageContext = React.createContext({
    t: (key) => key,
    language: "en",
    changeLanguage: () => { },
    formatNumber: () => { },
    format: () => { },
    normalizeLocale: () => { },
});

/* ---------------- Provider ---------------- */
export class LanguageProvider extends React.Component {
    state = { ready: false, language: null };

    async componentDidMount() {
        const lang = await Language.init(this.props);
        this.setState({ language: lang, ready: true });
        this.unsubscribe = Language.onLanguageChange(lang => this.setState({ language: lang }));
    }

    componentWillUnmount() {
        this.unsubscribe?.();
    }

    render() {
        if (!this.state.ready) return null;

        const ctx = {
            language: this.state.language,
            t: Language.t,
            changeLanguage: Language.changeLanguage.bind(Language),
            formatNumber: Language.formatNumber.bind(Language),
            format: Language.format.bind(Language),
            normalizeLocale: Language.normalizeLocale.bind(Language),
        };

        return (
            <LanguageContext.Provider value={ctx}>
                {this.props.children}
            </LanguageContext.Provider>
        );
    }
}

/* ---------------- HOC ---------------- */
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
                        format={ctx.format}
                        normalizeLocale={ctx.normalizeLocale}
                    />
                )}
            </LanguageContext.Consumer>
        );
    };
}

export default Language;
