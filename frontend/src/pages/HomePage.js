import React from "react";
import { tweetAPI } from "../api";
import Tweet from "../components/Tweet";
import LoadingSpinner from "../components/LoadingSpinner";
import { useInView } from "react-intersection-observer";

function HomePage() {
  const [tweets, setTweets] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [newTweet, setNewTweet] = React.useState("");
  const [isPosting, setIsPosting] = React.useState(false);
  // const { user } = React.useContext(UserContext);
  const user = {
    id: 1,
    username: "johndoe",
    avatar: "https://i.pravatar.cc/150?u=johndoe",
    name: "John Doe",
  };

  const { ref, inView } = useInView({
    threshold: 0,
  });

  React.useEffect(() => {
    loadTweets();
  }, []);

  React.useEffect(() => {
    if (inView && hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [inView, hasMore]);

  const loadTweets = async () => {
    try {
      setIsLoading(true);
      const response = await tweetAPI.getTimeline(page);

      const newTweets = response.tweets.map((t) => ({
        author: user,
        commentsCount: 0,
        isAuthor: t.user_id === user.id,
        ...t,
      }));

      /*tweet: PropTypes.shape({
        author: PropTypes.shape({
          username: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          avatar: PropTypes.string,
        }).isRequired,
        commentsCount: PropTypes.number.isRequired,
        is_liked: PropTypes.bool.isRequired,
        isAuthor: PropTypes.bool.isRequired,*/

      console.log(newTweets);
      if (page === 1) {
        setTweets(newTweets);
      } else {
        setTweets((prev) => [...prev, ...newTweets]);
      }

      setHasMore(response.tweets.length === 20);
    } catch (err) {
      setError("Failed to load tweets");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostTweet = async (e) => {
    e.preventDefault();
    if (!newTweet.trim()) return;

    try {
      setIsPosting(true);
      const tweet = await tweetAPI.createTweet(newTweet);
      const tweetNew = {
        ...tweet,
        author: user,
        commentsCount: 0,
        isAuthor: t.user_id === user.id,
      };
      setTweets((prev) => [tweetNew, ...prev]);
      setNewTweet("");
    } catch (err) {
      setError("Failed to post tweet");
    } finally {
      setIsPosting(false);
    }
  };

  // Handle like/unlike
  const handleLike = async (tweetId) => {
    const tweet = tweets.find((t) => t.id === tweetId);
    if (!tweet) return;

    try {
      if (tweet.is_liked) {
        await tweetAPI.unlikeTweet(tweetId);
      } else {
        await tweetAPI.likeTweet(tweetId);
      }

      setTweets((prev) =>
        prev.map((t) =>
          t.id === tweetId
            ? {
                ...t,
                is_liked: !t.is_liked,
                likesCount: t.likesCount + (t.is_liked ? -1 : 1),
              }
            : t
        )
      );
    } catch (err) {
      setError("Failed to update like");
    }
  };

  const handleDelete = async (tweetId) => {
    try {
      await tweetAPI.deleteTweet(tweetId);
      setTweets((prev) => prev.filter((t) => t.id !== tweetId));
    } catch (err) {
      setError("Failed to delete tweet");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tweet composer */}
      <div className="bg-white shadow rounded-lg mb-4 p-4">
        <form onSubmit={handlePostTweet}>
          <textarea
            value={newTweet}
            onChange={(e) => setNewTweet(e.target.value)}
            placeholder="What's happening?"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            rows="3"
            maxLength="280"
          />
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {280 - newTweet.length} characters remaining
            </span>
            <button
              type="submit"
              disabled={isPosting || !newTweet.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50"
            >
              {isPosting ? "Posting..." : "Tweet"}
            </button>
          </div>
        </form>
      </div>

      {/* Error message */}
      {/* Error message */}
      {error && (
        <ErrorState
          message={error}
          onRetry={() => {
            setError("");
            loadTweets();
          }}
        />
      )}

      {/* Tweets list */}
      <div className="space-y-4">
        {tweets.map((tweet) => (
          <Tweet
            key={tweet.id}
            tweet={tweet}
            onLike={handleLike}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {isLoading && <LoadingSpinner />}

      {/* Infinite scroll trigger */}
      {hasMore && <div ref={ref} className="h-10" />}

      {/* No more tweets message */}
      {!hasMore && !isLoading && (
        <p className="text-center text-gray-500 py-4">No more tweets to load</p>
      )}
    </div>
  );
}

export default HomePage;
