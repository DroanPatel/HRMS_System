// DRF returns { count, next, previous, results }. Dropdown loaders just want the rows;
// paged tables also want the total.
export const unwrapList = (data) => (Array.isArray(data) ? data : data?.results ?? []);

export const unwrapPage = (data) => ({
  results: unwrapList(data),
  count: Array.isArray(data) ? data.length : data?.count ?? 0,
});

// Used by "load everything" calls (dropdowns, small lookup tables).
export const ALL_ROWS = { page_size: 500 };
