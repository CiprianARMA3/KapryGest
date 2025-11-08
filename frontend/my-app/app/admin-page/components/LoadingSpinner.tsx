export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-base-content/70 text-lg">Loading Admin Dashboard...</p>
      </div>
    </div>
  );
}