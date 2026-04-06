"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 px-6">
      <div className="text-center max-w-md">
        <h2 className="font-serif italic text-3xl text-brown-900 mb-4">
          Oops, something went wrong
        </h2>
        <p className="font-sans text-brown-500 mb-8 text-sm leading-relaxed">
          An unexpected error occurred. Please try refreshing the page.
        </p>
        <button
          onClick={reset}
          className="gradient-sunset text-white font-sans font-medium px-8 py-3 rounded-full text-sm tracking-wide hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
