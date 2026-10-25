# react-native-web: hydration mismatch with `useWindowDimensions` / `useColorScheme`

An Expo Router app with `web.output: 'server'`: every page is rendered on the server, then hydrated in the browser.
`app/index.tsx` renders `useWindowDimensions()` and `useColorScheme()`.

The server has no window: it renders `Window: 0x0` and `Color scheme: light`. In the browser, both hooks return the
real values on the first render (e.g. `1024x768`, `dark`), so it doesn't match the HTML. React reports
"Hydration failed because the server rendered text didn't match the client" and re-renders the whole page on the
client, throwing away the server's HTML.

## Versions

react-native-web 0.21.4, Expo SDK 58 (`expo` 58.0.19, `expo-router` 58.0.26), React 19.3, React Native 0.88.

## Steps

```sh
bun install
bun run build      # expo export -p web (server output)
bun run serve      # http://localhost:8081
```

Open http://localhost:8081 with the console open (a dark color scheme shows both hooks), or run it headless:

```sh
bun run check      # headless Chromium, 1024x768, prefers-color-scheme: dark (CHROME_PATH, default /usr/bin/chromium)
```

**You see:**

```
server HTML: Window: 0x0 / Color scheme: light
hydrated:    Window: 1024x768 / Color scheme: dark
hydration errors: 1
  Minified React error #418; visit https://react.dev/errors/418?args[]=text&args[]= ...
```

(#418 is production React's code for "Hydration failed because the server rendered text didn't match the client".)

**You expect:** no hydration error: the first render matches the HTML, then the page shows the real values.

## Appendix: experimental fix (not proposed as is)

`fix.patch` is an experiment, not a proposed fix. It applies to the published 0.21.4 build. Both hooks use
`useSyncExternalStore`. While hydrating, they return the default server values (`0x0`, `"light"`).

```sh
bun run fix        # applies fix.patch to node_modules/react-native-web
bun run build && bun run serve
bun run check      # hydration errors: 0, then 1024x768 / dark
bun run unfix      # reverts it
```

Known problems:

- The values change immediately after mount. A `FlatList` whose `numColumns` depends on the width fails with
  "Changing numColumns on the fly is not supported".
- A server that calls `Dimensions.set` with an estimate always mismatches. The browser cannot get the estimate.
- `Dimensions.get('window')` still returns the real values, so it does not agree with the hook during the same render.
- `useColorScheme` changes from `"light"` to the real scheme after hydration. This is a change in behavior.
