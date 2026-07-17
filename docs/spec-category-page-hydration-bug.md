# Spec: Fix Category Page Hydration Bug

## Problem

On `/category/:slug`, selecting a category (or loading the page directly) initially renders the correct category-filtered servers, then ~300ms later reverts to the full unfiltered server list. The placeholder set includes MindsDB, BrowserUse, and Search — servers from the default "all" view.

## Root Cause

`ServerGrid.tsx` initializes its `category` React state to the hardcoded string `'all'` (line 352). When the component hydrates on the client:

1. `servers` state is seeded correctly from `initialServers` (the server already filtered by category).
2. The `useEffect` at line 401 fires after hydration because `category` (`'all'`) differs from the category that produced `initialServers`.
3. `fetchServers` is called with `category='all'`, returning the full unfiltered catalog.
4. This overwrites the correctly-filtered `servers` state.

`meta.category` is passed from `[slug].astro` (line 80) but is never read by `ServerGrid`.

## Reproduction

1. Navigate to `/category/databases`.
2. Observe: page initially shows database servers (server-rendered HTML).
3. After ~300ms, the list switches to the top-starred general servers (MindsDB, BrowserUse, etc.).

## Fix

### Part 1 — Initialize `category` from `meta`

In `ServerGrid.tsx`:

```tsx
const initialCategory = meta?.category || 'all';
const [category, setCategory] = useState(initialCategory);
```

This ensures the first client-side state matches the server-rendered data.

### Part 2 — Skip redundant initial fetch

Even with the correct initial category, the `useEffect` still fires on mount and triggers an unnecessary API call that flashes skeleton cards. Add a mount guard:

```tsx
const hasFetchedOnMount = useRef(false);

useEffect(() => {
  if (!hasFetchedOnMount.current) {
    hasFetchedOnMount.current = true;
    // Skip if state already matches the initial data source
    if (category === initialCategory && !search && !localOnly) {
      return;
    }
  }
  // existing debounce + fetchServers logic
}, [search, category, deployment, deployments, localOnly, fetchServers]);
```

This preserves the interactive filter behavior while avoiding the hydration race.

## Files to Change

- `src/components/ServerGrid.tsx` — state initialization + mount guard

## Verification

- [ ] Load `/category/databases` — only database servers render, no revert.
- [ ] Load `/category/search` — only search servers render, no revert.
- [ ] Click a category tag inside `ServerGrid` — list updates to the new category.
- [ ] Type in search box — debounced search works, category filter respected.
- [ ] Toggle "Local-Only" — filter applies correctly.
- [ ] "Load More" pagination works on category pages.
