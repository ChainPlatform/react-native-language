# Chain Platform Language
@chainplatform/language is a React Native library implement for react-native and react-native-web.

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

# 🗣️ @chainplatform/language

A lightweight, modular internationalization (i18n) manager for React Native and React Native Web apps — designed for dynamic translation loading, persistent language storage, and context-based rendering.

---

## 🚀 Features

- ✅ Simple and clean API (`Language.t(key)` or `t(key)` via context)
- 🔄 Auto language detection using `react-native-localize`
- 💾 Persistent storage with custom `get` / `set` support
- 🌍 Lazy load or fetch translations from API
- 🧩 React Context + HOC support (`withLanguage`)
- ⚡️ Zero dependencies (except React + RNLocalize)

---

## 📦 Installation

```bash
npm install @chainplatform/language
# or
yarn add @chainplatform/language
```

You also need to install `react-native-localize` `@chainplatform/sdk`:

```bash
npm install react-native-localize @chainplatform/sdk
```

---

## 🧠 Basic Usage

### 1️⃣ Initialize and wrap your app with `LanguageProvider`

```tsx
// App.js or App.tsx
import React from "react";
import { LanguageProvider } from "@chainplatform/language";
import MainNavigation from "./MainNavigation";

const translations = {
  en: { hello: "Hello World", change: "Change Language" },
  vi: { hello: "Xin chào", change: "Đổi ngôn ngữ" },
};

export default function App() {
  return (
    <LanguageProvider
      fallback="en"
      translations={translations}
      // Optionally:
      // lazyLoad={async (lang) => import(`./locales/${lang}.json`)}
      // storage={{ get: customGet, set: customSet }}
    >
      <MainNavigation />
    </LanguageProvider>
  );
}
```

---

### 2️⃣ Using `LanguageContext` inside components

```tsx
import React, { useContext } from "react";
import { LanguageContext } from "@chainplatform/language";
import { Button, Text, View } from "react-native";

export default function HomeScreen() {
  const { t, language, changeLanguage } = useContext(LanguageContext);

  return (
    <View>
      <Text>{t("hello")}</Text>
      <Button
        title={t("change")}
        onPress={() => changeLanguage(language === "en" ? "vi" : "en")}
      />
    </View>
  );
}
```

---

### 3️⃣ Using the HOC `withLanguage`

```tsx
import React from "react";
import { withLanguage } from "@chainplatform/language";
import { Button, Text } from "react-native";

function SettingsScreen({ t, language, changeLanguage }) {
  return (
    <>
      <Text>{t("hello")}</Text>
      <Button
        title={t("change")}
        onPress={() => changeLanguage(language === "en" ? "vi" : "en")}
      />
    </>
  );
}

export default withLanguage(SettingsScreen);
```

---

## ⚙️ API Reference

### 🔹 `LanguageProvider` Props

| Prop | Type | Description |
|------|------|-------------|
| `translations` | `{ [lang: string]: object }` | Static translation dictionary |
| `fallback` | `string` | Fallback language key (default: `"en"`) |
| `language` | `string` | Initial language (optional) |
| `lazyLoad` | `(lang: string) => Promise<object>` | Async loader for dynamic imports |
| `loadFromApi` | `(lang: string) => Promise<object>` | Load translation from API |
| `storage` | `{ get: (key) => Promise<any>, set: (key, val) => Promise<void> }` | Custom persistent storage |

---

### 🔹 `Language` Static Methods

| Method | Description |
|---------|-------------|
| `Language.init(options)` | Initialize language manager manually |
| `Language.t(key, vars?)` | Translate key with optional variables |
| `Language.changeLanguage(lang)` | Switch current language |
| `Language.onLanguageChange(cb)` | Subscribe to language changes |

---

### 🔹 `LanguageContext`

React Context that provides:
```ts
{
  t: (key: string, vars?: Record<string, any>) => string;
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
}
```

---

### 🔹 `withLanguage(WrappedComponent)`

Higher-Order Component that injects props:
```ts
{
  t,
  language,
  changeLanguage
}
```

---

## 🧩 Example: Dynamic Import

```tsx
<LanguageProvider
  lazyLoad={async (lang) => {
    const mod = await import(`../locales/${lang}.json`);
    return mod.default;
  }}
>
  <App />
</LanguageProvider>
```

---

## 💾 Storage Example

You can provide custom storage (e.g., using MMKV or AsyncStorage):

```tsx
import { MMKV } from "react-native-mmkv";
const storage = new MMKV();

<LanguageProvider
  storage={{
    get: async (key) => storage.getString(key),
    set: async (key, val) => storage.set(key, val),
  }}
>
  <App />
</LanguageProvider>
```

---

## 🧪 Debug Tips

- If translations don’t update, ensure your `LanguageProvider` wraps **the root of navigation** (not each screen).
- You can access the singleton `Language` instance anywhere:
  ```js
  import { Language } from "@chainplatform/language";
  console.log(Language.t("hello"));
  ```

---

## 📄 License

MIT © Chain Platform