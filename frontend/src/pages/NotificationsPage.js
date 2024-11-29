import React from 'react';
import { format } from 'date-fns';
import { Bell, Heart, MessageCircle, UserPlus, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

function NotificationIcon({ type }) {
  const iconProps = { className: "w-5 h-5" };
  switch (type) {
    case 'like':
      return <Heart {...iconProps} className="text-pink-500" />;
    case 'follow':
      return <UserPlus {...iconProps} className="text-blue-500" />;
    case 'reply':
      return <MessageCircle {...iconProps} className="text-green-500" />;
    default:
      return <Bell {...iconProps} className="text-gray-500" />;
  }
}

function NotificationItem({ notification }) {
  const { type, sender, created_at, content } = notification;

  return (
    <div className="flex items-start p-4 space-x-4 bg-white hover:bg-gray-50 border-b border-gray-200">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <NotificationIcon type={type} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <img
            src={sender.avatar || "/default-avatar.png"}
            alt={sender.username}
            className="w-6 h-6 rounded-full"
          />
          <span className="font-medium text-gray-900">{sender.name}</span>
          <span className="text-gray-500">@{sender.username}</span>
        </div>
        <p className="mt-1 text-gray-600">{content}</p>
        <time className="text-sm text-gray-500">
          {format(new Date(created_at), 'MMM d, yyyy · HH:mm')}
        </time>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Bell className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">No notifications yet</h3>
      <p className="mt-1 text-gray-500">
        When someone interacts with you or your tweets, you'll see it here
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
      <p className="mt-1 text-gray-500 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Try Again
      </button>
    </div>
  );
}

function NotificationsPage() {
  const [notifications, setNotifications] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      // Update local state to reflect all notifications as read
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchNotifications} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Notifications</h1>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;