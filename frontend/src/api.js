import axios from 'axios';


const api = axios.create({
    baseURL: '/api',  
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error);
    }
);


export const authAPI = {
    login: (credentials) => api.post('/users/auth/login', credentials),
    register: (userData) => api.post('/users/auth/register', userData),
    getCurrentUser: () => api.get('/users/me'),
    logout: () => {
        localStorage.removeItem('token');
        return api.post('/users/auth/logout');
    },
};

export const userAPI = {
    getProfile: (username) => api.get(`/users/${username}`),
    updateProfile: (userData) => api.put('/users/profile', userData),
    followUser: (username) => api.post(`/users/${username}/follow`),
    unfollowUser: (username) => api.delete(`/users/${username}/follow`),
};

export const tweetAPI = {
    createTweet: (content) => api.post('/tweets/post', { content }),
    deleteTweet: (tweetId) => api.delete(`/tweets/${tweetId}`),
    likeTweet: (tweetId) => api.post(`/tweets/${tweetId}/like`),
    unlikeTweet: (tweetId) => api.delete(`/tweets/${tweetId}/like`),
    getTimeline: (page = 1) => api.get(`/tweets/timeline?page=${page}`),
    getUserTweets: (username, page = 1) => 
        api.get(`/tweets/user/${username}?page=${page}`),
};

export const searchAPI = {
    searchUsers: (query) => api.get(`/search/users?q=${encodeURIComponent(query)}`),
    searchTweets: (query) => api.get(`/search/tweets?q=${encodeURIComponent(query)}`),
};

export default api;