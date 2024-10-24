import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI, tweetAPI } from '../api';
import Tweet from '../components/Tweet';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState(null);
  const [tweets, setTweets] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('tweets');
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Load profile data
  React.useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await userAPI.getProfile(username);
      setProfile(profileData);
      setIsFollowing(profileData.isFollowing);
      await loadTweets();
    } catch (err) {
      setError('Failed to load profile');
      if (err.response?.status === 404) {
        navigate('/404');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadTweets = async () => {
    try {
      const response = await tweetAPI.getUserTweets(username);
      setTweets(response.tweets);
    } catch (err) {
      setError('Failed to load tweets');
    }
  };

  const handleFollow = async () => {
    try {
      setIsUpdating(true);
      if (isFollowing) {
        await userAPI.unfollowUser(username);
      } else {
        await userAPI.followUser(username);
      }
      setIsFollowing(!isFollowing);
      // Update follower count
      setProfile(prev => ({
        ...prev,
        followersCount: prev.followersCount + (isFollowing ? -1 : 1)
      }));
    } catch (err) {
      setError('Failed to update follow status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLikeTweet = async (tweetId) => {
    try {
      const tweet = tweets.find(t => t.id === tweetId);
      if (!tweet) return;

      if (tweet.isLiked) {
        await tweetAPI.unlikeTweet(tweetId);
      } else {
        await tweetAPI.likeTweet(tweetId);
      }

      setTweets(prev => prev.map(t =>
        t.id === tweetId
          ? {
              ...t,
              isLiked: !t.isLiked,
              likesCount: t.likesCount + (t.isLiked ? -1 : 1)
            }
          : t
      ));
    } catch (err) {
      setError('Failed to update like');
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    try {
      await tweetAPI.deleteTweet(tweetId);
      setTweets(prev => prev.filter(t => t.id !== tweetId));
    } catch (err) {
      setError('Failed to delete tweet');
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Cover Photo */}
        <div 
          className="h-32 bg-blue-500"
          style={profile.coverPhoto ? { backgroundImage: `url(${profile.coverPhoto})` } : {}}
        />

        {/* Profile Info */}
        <div className="p-4">
          <div className="relative flex justify-between">
            {/* Avatar */}
            <div className="absolute -top-16">
              <img
                src={profile.avatar || '/default-avatar.png'}
                alt={profile.name}
                className="w-32 h-32 rounded-full border-4 border-white"
              />
            </div>

            {/* Follow Button */}
            {profile.isCurrentUser ? (
              <button
                onClick={() => navigate('/settings')}
                className="ml-auto px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50"
              >
                Edit profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                disabled={isUpdating}
                className={`ml-auto px-4 py-2 rounded-full ${
                  isFollowing
                    ? 'border border-gray-300 hover:border-red-500 hover:text-red-500'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isUpdating ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="mt-16">
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-gray-600">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-2 text-gray-800">{profile.bio}</p>
            )}

            {/* Meta Information */}
            <div className="mt-4 space-y-2">
              {profile.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center text-gray-600">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  <a href={profile.website} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}</span>
              </div>
            </div>

            {/* Follow Stats */}
            <div className="mt-4 flex space-x-4">
              <span className="text-gray-600">
                <span className="font-bold text-black">{profile.followingCount}</span> Following
              </span>
              <span className="text-gray-600">
                <span className="font-bold text-black">{profile.followersCount}</span> Followers
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('tweets')}
              className={`flex-1 py-3 text-sm font-medium text-center ${
                activeTab === 'tweets'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tweets
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-3 text-sm font-medium text-center ${
                activeTab === 'media'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 py-3 text-sm font-medium text-center ${
                activeTab === 'likes'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Likes
            </button>
          </nav>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            onClick={() => setError('')}
            className="absolute top-0 right-0 p-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Tweets List */}
      <div className="mt-4 space-y-4">
        {tweets.map(tweet => (
          <Tweet
            key={tweet.id}
            tweet={tweet}
            onLike={handleLikeTweet}
            onDelete={handleDeleteTweet}
          />
        ))}
        {tweets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No tweets yet
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;