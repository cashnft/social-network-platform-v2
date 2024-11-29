import unittest
from app import app, db
from datetime import datetime

class ChirperTests(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:password@localhost:5432/chirper_test'
        self.client = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_user_authentication(self):
   
        register_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'password123',
            'name': 'Test User'
        }
        
        response = self.client.post('/auth/register', json=register_data)
        self.assertEqual(response.status_code, 201)
        self.assertIn('token', response.json)
        

        login_data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post('/auth/login', json=login_data)
        self.assertEqual(response.status_code, 401)
        

        login_data['password'] = 'password123'
        response = self.client.post('/auth/login', json=login_data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.json)

    def test_tweet_creation_and_timeline(self):

        register_data = {
            'username': 'tweetuser',
            'email': 'tweet@example.com',
            'password': 'password123',
            'name': 'Tweet User'
        }
        response = self.client.post('/auth/register', json=register_data)
        token = response.json['token']
        headers = {'Authorization': f'Bearer {token}'}
        

        tweet_data = {'content': 'This is a test tweet #testing'}
        response = self.client.post('/tweets', 
                                  json=tweet_data, 
                                  headers=headers)
        self.assertEqual(response.status_code, 201)
        tweet_id = response.json['tweet']['id']
        
 
        response = self.client.get('/tweets/timeline', headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json['tweets']), 1)
        self.assertEqual(response.json['tweets'][0]['content'], 
                        tweet_data['content'])

if __name__ == '__main__':
    unittest.main()