> <h1 style="font-family: 'New York', 'Georgia', serif;">as‧tro‧lin‧gual</h1>
>
> 1. <span style="font-family: 'New York', 'Georgia', serif;">**adjective** _(linguistics, science fiction)_ Relating to the study of a language originating from alien species.</span>  
>    <sup style="font-family: 'New York', 'Georgia', serif;">**Synonyms:** _xenolingual, exolingual_</sup>

Astrolingual is a really simple Astro integration for internationalization (i18n).

## 📦 Installation & Setup

After installation, add the integration to your `astro.config.mjs` file and configure the locales you want to use.

> [!NOTE]
> Astrolingual builds upon Astro's i18n support. You have to define the locales you want to use in your `astro.config.mjs`/`ts` file. For more information, check out the [Astro i18n documentation](https://docs.astro.build/en/guides/internationalization/).

```typescript
export default defineConfig({
  // ...
  integrations: [astrolingual()],
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
    routing: { prefixDefaultLocale: false },
  },
  // ...
});
```

## 🌐 Usage

Create a `src/locales` folder and add your translation files there. The name of the file should be the locale code (e.g., `en.jsonc`, `es.jsonc`, etc.)

```jsonc
// src/locales/en.jsonc (you can also just use plain .json)

{
  "greeting": "Hello World!",
}
```

From there, you can use the `Astrolingual.use()` function to access the translations in your components.

```astro
---
import { Astrolingual } from "astrolingual/runtime";

// this will return the translations for the current locale according to Astro. you can optionally implement your own logic.
const t = Astrolingual.use(Astro.currentLocale);
---
```

Access the translations using the defined object (`t` in this case).

```astro
<p>{t.greeting}</p> <!-- Hello World! -->
```

As you can see, types are automatically inferred from the translation files, so you will get autocompletion and type checking in your IDE.

---

You can also organize your translations in a nested structure. There is technically no limit to how deep you can nest your translations, but be coherent about it.

```jsonc
{
  "hero": {
    "primary": {
      "greeting": "Hello World!",
    },
  },
}
```

Then, access them accordingly:

```astro
<p>{t.hero.primary.greeting}</p> <!-- Hello World! -->
```

### 🔄 Variables

You can use variables in your translation strings by using the `$` symbol followed by the index of the variable.

```jsonc
{
  "greeting": "Hello $0!",
  "calendarAndForecast": "Today is $0, and it's $1°C outside.",
}
```

Then, you can pass the variables as arguments in parentheses after the translation key.

```astro
---
const username = "soywig"
const dayOfWeek = "Wednesday"
const temperatureC = 19
// ...
---

<p>{t.greeting(username)}</p> <!-- Hello soywig! -->
<p>{t.calendarAndForecast(dayOfWeek, temperatureC)}</p>
<!-- Today is Wednesday, and it's 19°C outside. -->
```

> [!NOTE]
> In the rare event that your string template has more than 10 variables, access them using letters starting with `$a`.

If you need to use a literal dollar sign in your translation string, you can escape it with either another dollar sign or a space afterwards:

```jsonc
{
  "fees": {
    "delivery": "Delivery service is $ 3.",
    "service": "There is a $$0.50 service fee.",
  },
}
```

```astro
<p>{t.fees.delivery}</p> <!-- Delivery service is $3. -->
<p>{t.fees.service}</p> <!-- There is a $0.50 service fee. -->
```

> [!NOTE]
> Variables are HTML-escaped, so passing user input is safe. The exception is the result of another translation (like `t.something()`), which is trusted and inserted as-is, so you can nest translations.

### 📈 Plurals

Astrolingual supports switching between different plural forms based on the number provided as a variable.

```jsonc
{
  "publishedHoursAgo": {
    // the variable `$0` is used to determine the pluralization
    "$0": {
      "one": "published $0 hour ago",
      "other": "published $0 hours ago",
    },
  },
}
```

> [!IMPORTANT]
> Different languages have different pluralization rules. Astrolingual uses the [Intl.PluralRules API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules) to determine the correct plural form for the current locale.
>
> In English, there are only two plural forms: `one` and `other`. But for example, in Russian, there are three plural forms: `one`, `few`, and `many`. If there were a `ru.jsonc` file, it should contain all three. The `en.jsonc` would not change.

Use the pluralized string as you would normally do with any variable string:

```astro
---
const hoursAgo = 3
// ...
---
<p>{t.publishedHoursAgo(hoursAgo)}</p> <!-- published 3 hours ago -->
```

You can also use multiple variables in your pluralized strings.

You will have to define the pluralization for every case where it changes. (e.g., if there are two variables that can change the pluralization, you will have to define the pluralization for every combination of those two variables, so 4 in English.)

```jsonc
{
  "publishedHoursMinutesAgo": {
    "$0": {
      "one": {
        "$1": {
          "one": "published $0 hour and $1 minute ago",
          "other": "published $0 hour and $1 minutes ago",
        },
      },
      "other": {
        "$1": {
          "one": "published $0 hours and $1 minute ago",
          "other": "published $0 hours and $1 minutes ago",
        },
      },
    },
  },
}
```

```astro
---
const hoursAgo = 3
const minutesAgo = 45
// ...
---

<p>{t.publishedHoursMinutesAgo(hoursAgo, minutesAgo)}</p>
<!-- published 3 hours and 45 minutes ago -->
```

> [!NOTE]
> Not all variables need to be used in the pluralization, nor the pluralized variable must be used. You can use as many or as few as are necessary:
>
> ```jsonc
> {
>   "timeLeft": {
>     "$0": {
>       "one": "$0:$1 hour left",
>       "other": "$0:$1 hours left",
>     },
>   },
> }
> ```

### 📝 Formatting

Some Markdown quirks are supported in the translation strings. You can use `_` for italic text, `**` for bold text, or both.

```jsonc
{
  "myFormattedString": "I can use _italic text_, **bold text** or _**both**_!",
}
```

This will turn into:

```astro
I can use <em>italic text</em>, <strong>bold text</strong> or <em><strong>both</strong></em>!
```

> [!TIP]
> Of course, you can then use CSS to style the generated `<strong>` and `<em>` tags. You can use them however you want outside of the default behavior.

#### Links

You can also use Markdown links in your translation strings. They will be converted into `<a>` tags.

```jsonc
{
  "myLink": "You can check out [Astro](https://astro.build) for more information.",
}
```

> [!TIP]
> The recommended approach for links is to use variables in them. This way, the link is set in the component instead.
>
> ```jsonc
> {
>   "myLinkWithVariable": "You can check out [Astro]($0) for more information.",
> }
> ```
>
> ```astro
> <p>{t.myLinkWithVariable("https://astro.build")}</p>
> ```

> [!NOTE]
> Links starting with `http://` or `https://` automatically open in a new tab. Only `http(s)`, `mailto:`, `tel:` and relative or `#` links are allowed. Anything else (like `javascript:`) is replaced with `#`.

### 📄 Dealing with multiple lines

There are two main ways of dealing with strings with multiple lines or texts that are split across multiple elements:

#### If you want to access them separately (recommended)

Declare the string as an array and access them accordingly. This is the recommended approach in most cases.

```jsonc
{
  "shoppingList": ["Milk", "Eggs", "Cheese"],
}
```

```astro
<ul>
  <li>{t.shoppingList[0]}</li> <!-- Milk -->
  <li>{t.shoppingList[1]}</li> <!-- Eggs -->
  <li>{t.shoppingList[2]}</li> <!-- Cheese -->
</ul>
```

Since it's an array you can automate this too:

```astro
<ul>
  {t.shoppingList.map((item) => (
    <li>{item}</li>
  ))}
</ul>
```

This is especially useful when a text is separated into multiple elements and it allows you to avoid creating multiple keys for the same text, easing the translation process as well since they are visibly grouped in the strings file.

#### If you want to access them together

You can also just use `\n` for new lines. It will be available as a single string that you can manage however you want.

```jsonc
{
  "shoppingList": "Milk\nEggs\nCheese",
}
```

By default, they will turn into line breaks.

```astro
<p>{t.shoppingList}</p>
<!--
  Milk
  Eggs
  Cheese
 -->
```

## 🗺️ Pages & routing

You write your pages **once**, in your default language, and Astrolingual generates the rest. No need to copy `src/pages` into a `src/pages/[locale]/` folder for every locale: the copies are created internally at build time and never show up in your source.

```
src/pages/
├── index.astro       →  /            /[locale]/
├── about.astro       →  /about       /[locale]/about
└── blog/
    └── [slug].astro  →  /blog/:slug  /[locale]/blog/:slug
```

That means adding a new language is just two steps: add it to your `astro.config` and create its locale file.

### ✍️ Overriding a page

Sometimes you need a page to be different in one language. Create the file inside that locale's folder and it will replace the generated one:

```
src/pages/
├── index.astro
├── about.astro
└── [locale]/
    └── about.astro     ← replaces only /[locale]/about
```

Overrides work per file: here only /[locale]/about is custom, everything else is still generated.

> [!NOTE]
> Files and folders starting with `_`, and non-page files like endpoints (`.ts`/`.js`), are not replicated.

### 🔀 With `prefixDefaultLocale`

If you use `routing: { prefixDefaultLocale: true }`, the default locale gets generated copies too (`/en/about`). A real `src/pages/en/about.astro` overrides it like any other locale.

### ⛔ Turning it off

Would you rather write every page per locale yourself? Disable it:

```typescript
astrolingual({ autoRoutes: false });
```

## 🛠️ Customization

You can customize the behavior of Astrolingual by passing options to the integration:

```typescript
// astro.config.mjs / astro.config.ts

export default defineConfig({
  // ...
  integrations: [
    astrolingual({
      // the path to the locales folder. relative to the Astro project root.
      // defaults to `src/locales`.
      localesDir: "src/i18n",
      // the locale used for types and as the last fallback.
      // defaults to Astro's `i18n.defaultLocale`.
      defaultLocale: "en",
      // automatically replicate your pages for every locale. defaults to true.
      autoRoutes: true,
    }),
  ],
  // ...
});
```

## 💡 Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, feel free to open an issue or submit a pull request.

## 📄 License

Astrolingual is licensed under the [ISC License](LICENSE.md).

This project is not affiliated with or endorsed by the Astro framework or its maintainers.