import { AlertCircle } from 'lucide-react';

const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;