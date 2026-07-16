# Cursor Pagination and Infinite Scroll

## Purpose

This document explains how job-listing pagination and infinite scrolling are currently implemented in the app.

It is written for the whole engineering team, including junior developers and interns, so it focuses on the practical flow first, then the implementation details.

## Important naming note

The current app uses **TanStack Virtual** through `@tanstack/react-virtual`.

So the current implementation is:

- Backend: cursor-based pagination.
- Frontend data fetching: manual state + axios.
- Frontend rendering: infinite scroll trigger + TanStack Virtual.

## Why Cursor Pagination

Cursor pagination is used instead of offset pagination for the jobs list.

Offset pagination looks like this:

```txt
GET /api/jobs?page=3&limit=10
```

Cursor pagination looks like this:

```txt
GET /api/jobs?limit=10&cursor=<encodedCursor>
```

Cursor pagination is better for feeds and infinite scroll because:

- It performs better as the dataset grows.
- It is less likely to skip or duplicate records when new jobs are inserted.
- It gives the backend a stable "continue from here" marker.

## Backend API Contract

### Endpoint

```txt
GET /api/jobs
```

### Query Parameters

```txt
limit   number  optional  defaults to 10
cursor  string  optional  base64 encoded cursor from the previous response
search  string  optional  search term
```

### Response Shape

The controller wraps the service response in the app's standard response format:

```json
{
  "success": true,
  "data": {
    "jobs": [],
    "pagination": {
      "hasMore": true,
      "nextCursor": "..."
    }
  }
}
```

The frontend receives `response.data.data`, so it works directly with:

```ts
{
  jobs: Job[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}
```

## Cursor Format

Cursor helpers live in:

```txt
backend/src/utils/cursor.js
```

The cursor stores two values:

```js
{
  createdAt,
  id
}
```

The object is converted to JSON and base64 encoded.

Example simplified cursor before encoding:

```json
{
  "createdAt": "2026-07-16T10:30:00.000Z",
  "id": "job-id-123"
}
```

The client should treat the cursor as an opaque string. It should not decode, edit, or build cursors itself.

## Backend Sorting Strategy

The jobs list is sorted by:

```js
[
  ["createdAt", "DESC"],
  ["id", "DESC"]
]
```

This means:

1. Newer jobs come first.
2. If two jobs have the same `createdAt`, `id` is used as a tie-breaker.

The tie-breaker is important. Cursor pagination needs a deterministic order, otherwise records can appear twice or be skipped.

## Backend Pagination Flow

Main implementation:

```txt
backend/src/modules/jobListings/jobListing.service.js
```

### First page

The frontend calls:

```txt
GET /api/jobs?limit=10
```

No cursor is sent.

The backend returns the newest jobs.

### Next page

The frontend calls:

```txt
GET /api/jobs?limit=10&cursor=<nextCursor>
```

The backend decodes the cursor and applies this condition:

```sql
("JobListing"."createdAt", "JobListing"."id")
<
(:cursorCreatedAt, :cursorId)
```

Because the sort order is descending, this means:

```txt
Give me jobs older than the last job from the previous page.
```

## Why Backend Fetches `limit + 1`

The service asks the database for one extra row:

```js
limit: Number(limit) + 1
```

Example:

```txt
Client asks for 10 jobs.
Backend fetches 11 jobs.
```

Then:

- If 11 jobs come back, there is another page.
- The extra job is removed before sending the response.
- `hasMore` is set to `true`.
- `nextCursor` is built from the last job actually returned to the client.

This avoids a separate database count query.

## Search Behavior

Search is handled differently from the normal feed.

When `search` is provided, the backend:

- Uses PostgreSQL full-text search with `search_vector`.
- Sorts by `ts_rank`, then `createdAt`, then `id`.
- Does **not** apply cursor pagination.

Reason:

Search ranking makes cursor pagination more complex because the primary sort becomes a calculated relevance score instead of just `createdAt` and `id`.

Current backend comment says search results are expected to be smaller, so cursor pagination is skipped for search.

Important team note: the frontend still passes cursor-related state during search today. If we want fully correct search pagination later, we should either:

- reset pagination state when search changes and fetch only the first search result page, or
- implement ranked cursor pagination using rank + createdAt + id.

## Frontend Fetching Layer

File:

```txt
frontend/src/services/jobs.service.ts
```

The `getJobs` function calls:

```ts
api.get("/jobs", {
  params: {
    limit,
    cursor,
    search,
  },
});
```

This function returns the backend `data` payload:

```ts
return response.data.data;
```

Although the return type currently says `Promise<Job[]>`, the real returned shape is:

```ts
{
  jobs: Job[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
}
```

Team recommendation: update this TypeScript return type in a future cleanup so the code documents itself better.

## Frontend State

Main state lives in:

```txt
frontend/src/pages/Dashboard.tsx
```

Relevant state:

```ts
const [jobs, setJobs] = useState<Job[]>([]);
const [loadingMore, setLoadingMore] = useState(false);
const [nextCursor, setNextCursor] = useState(null);
const [hasMore, setHasMore] = useState(true);
```

Each field has a specific job:

- `jobs`: all jobs currently loaded into the UI.
- `loadingMore`: prevents duplicate pagination requests.
- `nextCursor`: tells the backend where to continue.
- `hasMore`: tells the UI whether another page exists.

## Initial Load

On dashboard load, `loadDashboard()` calls:

```ts
getJobs(10, nextCursor)
```

The first time this runs, `nextCursor` is `null`.

The response is then used to initialize:

```ts
setJobs(jobsData.jobs);
setNextCursor(jobsData.pagination.nextCursor);
setHasMore(jobsData.pagination.hasMore);
```

## Loading More Jobs

The `loadMoreJobs()` function handles fetching the next page.

It exits early if:

```ts
loadingMore || !hasMore || !nextCursor
```

That protects us from:

- calling the API while a previous page is still loading,
- calling the API when the backend says there are no more jobs,
- calling the API without a cursor.

When the request succeeds:

```ts
setJobs((prev) => [...prev, ...response.jobs]);
setNextCursor(response.pagination.nextCursor);
setHasMore(response.pagination.hasMore);
```

The new page is appended to the existing list.

## Infinite Scroll Rendering

Files involved:

```txt
frontend/src/components/dashboard/CandidateDashboard.tsx
frontend/src/components/jobs/VirtualizedJobList.tsx
```

`CandidateDashboard` passes the list state and `loadMore` function into `VirtualizedJobList`.

`VirtualizedJobList` uses:

```ts
useVirtualizer
```

from:

```txt
@tanstack/react-virtual
```

## What TanStack Virtual Does

TanStack Virtual does not fetch data.

Its job is rendering performance.

If we have 1,000 jobs loaded, rendering all 1,000 DOM nodes would be expensive. TanStack Virtual renders only the visible rows plus a small buffer.

Current settings:

```ts
const rowVirtualizer = useVirtualizer({
  count: jobs.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 180,
  overscan: 8,
});
```

Meaning:

- `count`: number of loaded jobs.
- `getScrollElement`: the scroll container.
- `estimateSize`: estimated row height in pixels.
- `overscan`: render 8 extra rows around the visible area to keep scrolling smooth.

## How Infinite Scroll Is Triggered

`VirtualizedJobList` checks which rows are visible:

```ts
const virtualItems = rowVirtualizer.getVirtualItems();
```

Then it looks at the last visible row:

```ts
const lastVisible = virtualItems[virtualItems.length - 1].index;
```

It triggers loading when the user is close to the end:

```ts
const shouldLoad = lastVisible >= jobs.length - 5;
```

So if the user scrolls within 5 items of the end, the frontend asks for the next page.

## Duplicate Request Protection

The virtualized list uses:

```ts
const loadTriggeredRef = useRef(false);
```

This prevents repeated `loadMore()` calls while the user remains near the bottom of the list.

Flow:

1. User scrolls near bottom.
2. `shouldLoad` becomes `true`.
3. If `loadTriggeredRef.current` is `false`, call `loadMore()`.
4. Set `loadTriggeredRef.current = true`.
5. Once the user scrolls away from the loading threshold, reset it to `false`.

This is important because React effects can run multiple times, and virtualized lists recalculate often while scrolling.

## End-to-End Flow

### First page

```txt
Dashboard loads
  -> getJobs(10, null)
  -> Backend returns jobs + nextCursor + hasMore
  -> Dashboard stores jobs and pagination state
  -> VirtualizedJobList renders visible jobs
```

### Next page

```txt
User scrolls near bottom
  -> VirtualizedJobList detects last visible row is near jobs.length
  -> loadMoreJobs() runs
  -> getJobs(10, nextCursor)
  -> Backend returns next page
  -> Dashboard appends jobs
  -> VirtualizedJobList now has more rows to render
```

### No more pages

```txt
Backend returns hasMore: false
  -> Dashboard stores hasMore = false
  -> VirtualizedJobList stops calling loadMore
```

## Files to Read

Backend:

```txt
backend/src/modules/jobListings/jobListing.controller.js
backend/src/modules/jobListings/jobListing.service.js
backend/src/utils/cursor.js
```

Frontend:

```txt
frontend/src/services/jobs.service.ts
frontend/src/pages/Dashboard.tsx
frontend/src/components/dashboard/CandidateDashboard.tsx
frontend/src/components/jobs/VirtualizedJobList.tsx
```

## Current Caveats

### 1. TanStack Query is not currently used

The implementation uses manual React state and axios. If we choose to adopt TanStack Query later, this flow should move to `useInfiniteQuery`.

### 2. TypeScript return type for `getJobs` is inaccurate

The function is typed as returning `Promise<Job[]>`, but it actually returns an object containing `jobs` and `pagination`.

Recommended future type:

```ts
type JobsResponse = {
  jobs: Job[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
};
```

### 3. Search pagination needs a product decision

Backend search currently avoids cursor pagination. Frontend search state should be reviewed so search results do not accidentally append stale non-search pages.

### 4. Debug logs remain in pagination code

There are several `console.log` calls in the dashboard and job service around cursors. These are useful during development but should be removed or replaced with structured logging before production.

## Future TanStack Query Direction

If we later switch to TanStack Query, the frontend should use `useInfiniteQuery`.

The query would conceptually look like:

```ts
useInfiniteQuery({
  queryKey: ["jobs", searchTerm],
  initialPageParam: null,
  queryFn: ({ pageParam }) => getJobs(10, pageParam, searchTerm),
  getNextPageParam: (lastPage) =>
    lastPage.pagination.hasMore
      ? lastPage.pagination.nextCursor
      : undefined,
});
```

Then the flattened job list would come from:

```ts
data.pages.flatMap((page) => page.jobs)
```

TanStack Virtual could still be used for rendering. TanStack Query would own fetching and pagination state, while TanStack Virtual would own efficient list rendering.

## Mental Model

Think of the system as two separate responsibilities:

```txt
Cursor pagination answers: "Which records should we fetch next?"
Infinite scroll answers: "When should we fetch the next page?"
Virtualization answers: "How many loaded records should we render right now?"
```

Keeping those responsibilities separate makes the feature easier to reason about and easier to maintain.
