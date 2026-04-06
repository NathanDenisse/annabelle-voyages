"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-6">
      <div className="text-center max-w-md">
        <h2 className="font-serif text-2xl text-brown-900 mb-4">
          Admin Error
        </h2>
        <p className="font-sans text-brown-500 mb-2 text-sm">
          Something went wrong in the admin panel.
        </p>
        {error.message && (
          <p className="font-mono text-xs text-red-500 bg-red-50 p-3 rounded-lg mb-6">
            {error.message}
          </p>
        )}
        <button
          onClick={reset}
          className="bg-brown-900 text-white font-sans font-medium px-6 py-2.5 rounded-lg text-sm hover:bg-brown-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
