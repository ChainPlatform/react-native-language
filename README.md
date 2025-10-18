# Language Manager for React Native

A lightweight and flexible language management system for React Native apps. Supports local storage, lazy loading, API-based translation loading, and full React Context integration.

<p align="center">
  <a href="https://github.com/ChainPlatform/react-native-language/blob/HEAD/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="https://www.npmjs.com/package/@chainplatform/language">
    <img src="https://img.shields.io/npm/v/@chainplatform/language?color=brightgreen&label=npm%20package" alt="Current npm package version." />
  </a>
  <a href="https://www.npmjs.com/package/@chainplatform/language">
    <img src="https://img.shields.io/npm/dt/@chainplatform/language.svg"></img>
  </a>
  <a href="https://www.npmjs.com/package/@chainplatform/language">
    <img src="https://img.shields.io/badge/platform-android%20%7C%20ios%20%7C%20web-blue"></img>
  </a>
  <a href="https://github.com/ChainPlatform/react-native-language/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=doansan">
    <img src="https://img.shields.io/twitter/follow/doansan.svg?label=Follow%20@doansan" alt="Follow @doansan" />
  </a>
</p>

---

## 🚀 Features
- Persistent language storage
- Auto-detect device locale
- Lazy-load translation files
- Optional API-based translation loading
- Simple string interpolation
- Number and date formatting using `Intl`
- React Context + HOC integration
- Type-safe and lightweight

---

## 📦 Installation

```bash
npm install @chainplatform/language
# or
yarn add @chainplatform/language
```

---

## 🧠 Usage

### 1️⃣ Basic Setup

```jsx
import React from "react";
import { LanguageProvider } from "@chainplatform/language";
import App from "./App";

export default function Root() {
  return (
    <LanguageProvider
      fallback="en"
      translations={{
        en: { hello: "Hello" },
        vi: { hello: "Xin chào" }
      }}
    >
      <App />
    </LanguageProvider>
  );
}
```

---

### 2️⃣ Using the `t()` function

You can use the `LanguageContext` hook or `withLanguage` HOC to access translation functions.

#### ✅ Using React Context

```jsx
import React, { useContext } from "react";
import { LanguageContext } from "@chainplatform/language";

export default function MyComponent() {
  const { t, changeLanguage } = useContext(LanguageContext);

  return (
    <>
      <Text>{t("hello")}</Text>
      <Button title="Switch to Vietnamese" onPress={() => changeLanguage("vi")} />
    </>
  );
}
```

#### ✅ Using HOC

```jsx
import React from "react";
import { withLanguage } from "@chainplatform/language";

function MyComponent({ t, language }) {
  return <Text>{t("hello")} ({language})</Text>;
}

export default withLanguage(MyComponent);
```

---

### 3️⃣ Lazy Loading Translations

```js
<LanguageProvider
  fallback="en"
  lazyLoad={async (lang) => {
    switch (lang) {
      case "vi":
        return await import("./locales/vi.json").then(m => m.default);
      case "en":
        return await import("./locales/en.json").then(m => m.default);
      default:
        return {};
    }
  }}
>
  <App />
</LanguageProvider>
```

---

### 4️⃣ API-Based Loading

```js
<LanguageProvider
  fallback="en"
  loadFromApi={async (lang) => {
    const res = await fetch(`https://example.com/i18n/${lang}.json`);
    return await res.json();
  }}
>
  <App />
</LanguageProvider>
```

---

### 5️⃣ Persistent Storage

By default, it uses `@chainplatform/sdk`’s `retrieveStorage` and `saveStorage`.  
You can override with your own implementation:

```js
<LanguageProvider
  storage={{
    get: async (key) => AsyncStorage.getItem(key),
    set: async (key, val) => AsyncStorage.setItem(key, val)
  }}
>
  <App />
</LanguageProvider>
```

---

### 6️⃣ Formatting Helpers

```js
t("welcome", { name: "John" }); // "Welcome, John"

formatNumber(123456.78); // 123,456.78 or 123.456,78 depending on locale
format("DateTimeFormat", new Date(), { dateStyle: "medium" });
```

---

## ⚙️ API Reference

### `Language.init(options)`
Initializes the language manager.  
Called automatically by `LanguageProvider`.

| Option | Type | Description |
|--------|------|-------------|
| fallback | string | Default fallback language |
| translations | object | Predefined translations |
| lazyLoad | function | Async function to load translation file dynamically |
| loadFromApi | function | Async function to fetch translations from API |
| language | string | Force set initial language |
| storage | object | Custom `{ get, set }` async storage methods |
| storage_key | string | Custom key for language storage |

---

### `Language.t(key, vars)`
Translates a key with optional variables.

### `Language.changeLanguage(lang)`
Changes the current language and saves it to storage.

### `Language.onLanguageChange(callback)`
Subscribes to language changes.

---

## 🧩 Example Translation Files

**`locales/en.json`**
```json
{
  "hello": "Hello",
  "welcome": "Welcome, {name}!"
}
```

**`locales/vi.json`**
```json
{
  "hello": "Xin chào",
  "welcome": "Chào mừng, {name}!"
}
```

---

## 📄 License
MIT License © ChainPlatform
