/**
 * Yoast-style SEO Check List Component
 * Displays list of SEO checks with status indicators
 */
export default function SeoCheckList({ checks = [] }) {
  if (checks.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No SEO checks available. Enter a title and primary keyword to get started.
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "good":
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "ok":
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case "bad":
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "good":
        return "bg-green-50 border-green-200";
      case "ok":
        return "bg-yellow-50 border-yellow-200";
      case "bad":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-2">
      {checks.map((check, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 p-3 rounded-lg border ${getStatusColor(check.status)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(check.status)}
          </div>
          <p className="text-sm text-gray-700 flex-1">{check.label}</p>
        </div>
      ))}
    </div>
  );
}

