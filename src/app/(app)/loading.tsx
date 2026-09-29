export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Wird geladen" className="animate-pulse space-y-5">
      <div className="h-9 w-56 rounded-2xl bg-mint-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-44 rounded-3xl bg-mint-100/70" />
        ))}
      </div>
    </div>
  );
}
