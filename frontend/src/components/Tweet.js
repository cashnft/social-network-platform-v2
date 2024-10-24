import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function Tweet({ tweet, onLike, onDelete }) {
  const [isLiking, setIsLiking] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleLike = async () => {
    try {
      setIsLiking(true);
      await onLike(tweet.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this tweet?')) {
      try {
        setIsDeleting(true);
        await onDelete(tweet.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <article className="bg-white p-4 border-b border-gray-200 hover:bg-gray-50">
      <div className="flex space-x-3">
        <img
          src={tweet.author.avatar || '/default-avatar.png'}
          alt={tweet.author.username}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1 min-w-0">
          {/* Tweet Header */}
          <div className="flex items-center space-x-1">
            <Link 
              to={`/profile/${tweet.author.username}`}
              className="font-medium text-gray-900 hover:underline"
            >
              {tweet.author.name}
            </Link>
            <span className="text-gray-500">@{tweet.author.username}</span>
            <span className="text-gray-500">·</span>
            <time className="text-gray-500">
              {formatDistanceToNow(new Date(tweet.createdAt), { addSuffix: true })}
            </time>
          </div>

          {/* Tweet Content */}
          <p className="mt-1 text-gray-900 whitespace-pre-wrap">{tweet.content}</p>

          {/* Tweet Actions */}
          <div className="mt-3 flex items-center space-x-6">
            <button
              className={`flex items-center space-x-1 text-gray-500 hover:text-red-500 ${
                tweet.isLiked ? 'text-red-500' : ''
              }`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`w-5 h-5 ${tweet.isLiked ? 'fill-current' : ''}`} />
              <span>{tweet.likesCount}</span>
            </button>
            <button
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{tweet.commentsCount}</span>
            </button>
            {tweet.isAuthor && (
              <button
                className="text-gray-500 hover:text-red-500"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default Tweet;