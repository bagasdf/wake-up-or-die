# Wake Up or Die

## Shared i18n package

Shared locale dictionaries and routing configuration used by the web app. The package uses `next-intl`.

## Locales

- `id` — Indonesian and default locale
- `en` — English

Locale prefixes use the `as-needed` strategy, so the default Indonesian locale does not require a URL prefix.

## Package exports

- `@wuod/i18n` — locale configuration and message loading
- `@wuod/i18n/routing` — shared locale routing
- `@wuod/i18n/messages/<locale>` — locale dictionary, such as `@wuod/i18n/messages/id`

Add or update translations in `src/messages/id.json` and `src/messages/en.json`. Keep message keys aligned across both files.
