/** Thin animated bar for "actively working, no known duration" states (e.g.
 * a document being chunked/embedded/indexed) — a clearer "this is actively
 * working" signal than a small spinner alone. See the `indeterminate-bar`
 * keyframes in globals.css. */
export function IndeterminateBar() {
  return (
    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-primary/10" aria-hidden="true">
      <div className="indeterminate-bar-fill h-full w-1/3 rounded-full bg-primary/70" />
    </div>
  );
}
