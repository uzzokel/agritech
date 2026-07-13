// app/page.tsx
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <span className="text-sm font-semibold tracking-wider uppercase text-brand-accent mb-2">
        Site is Live
      </span>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-brand-primary">
        Welcome to CampusLink
      </h1>
      <p className="max-w-md text-base opacity-75 mb-6">
        Scroll down to see the transparent navbar transition seamlessly into a polished white frosted backdrop.
      </p>
      
      {/* Mock height elements to allow you to scroll and test the sticky navigation bar transition */}
      <div className="h-[120vh] w-full max-w-2xl mt-12 rounded-2xl border border-dashed border-canvas-border flex items-center justify-center bg-canvas-card shadow-sm">
        <p className="text-sm opacity-50">Scroll down to see the Navbar scroll change...</p>
      </div>
    </div>
  );
}