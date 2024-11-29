from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from datetime import datetime
import os

app = Flask(__name__)

#conf
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/chirper_tweets')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', '')
app.url_map.strict_slashes = False

#init the extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

#models
class Tweet(db.Model):
    __tablename__ = 'tweets'

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(280), nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    #for likes
    likes = db.relationship('Like', backref='tweet', lazy=True, cascade='all, delete-orphan')

class Like(db.Model):
    __tablename__ = 'likes'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    tweet_id = db.Column(db.Integer, db.ForeignKey('tweets.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'tweet_id', name='unique_user_like'),)

#routes
@app.route('/tweets/post', methods=['POST'])
@jwt_required()
def create_tweet():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
        
    if len(data['content']) > 280:
        return jsonify({'error': 'Tweet is too long'}), 400

    try:
        tweet = Tweet(
            content=data['content'],
            user_id=current_user_id
        )
        db.session.add(tweet)
        db.session.commit()

        return jsonify({
            'message': 'Tweet created successfully',
            'tweet': {
                'id': tweet.id,
                'content': tweet.content,
                'user_id': tweet.user_id,
                'created_at': tweet.created_at.isoformat(),
                'likes_count': len(tweet.likes),
                'is_liked': any(like.user_id == current_user_id for like in tweet.likes)
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/tweets/timeline', methods=['GET'])
@jwt_required()
def get_timeline():
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    try:
        
        tweets = Tweet.query.order_by(Tweet.created_at.desc())\
            .paginate(page=page, per_page=per_page)

        return jsonify({
            'tweets': [{
                'id': tweet.id,
                'content': tweet.content,
                'user_id': tweet.user_id,
                'created_at': tweet.created_at.isoformat(),
                'likes_count': len(tweet.likes),
                'is_liked': any(like.user_id == current_user_id for like in tweet.likes)
            } for tweet in tweets.items],
            'total': tweets.total,
            'pages': tweets.pages,
            'current_page': tweets.page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/tweets/<int:tweet_id>', methods=['DELETE'])
@jwt_required()
def delete_tweet(tweet_id):
    current_user_id = get_jwt_identity()
    tweet = Tweet.query.get_or_404(tweet_id)

    if tweet.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        db.session.delete(tweet)
        db.session.commit()
        return jsonify({'message': 'Tweet deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/tweets/<int:tweet_id>/like', methods=['POST'])
@jwt_required()
def like_tweet(tweet_id):
    current_user_id = get_jwt_identity()
    tweet = Tweet.query.get_or_404(tweet_id)

    try:
        existing_like = Like.query.filter_by(
            user_id=current_user_id,
            tweet_id=tweet_id
        ).first()

        if existing_like:
            return jsonify({'error': 'Tweet already liked'}), 400

        like = Like(user_id=current_user_id, tweet_id=tweet_id)
        db.session.add(like)
        db.session.commit()

        return jsonify({
            'message': 'Tweet liked successfully',
            'likes_count': len(tweet.likes)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/tweets/<int:tweet_id>/like', methods=['DELETE'])
@jwt_required()
def unlike_tweet(tweet_id):
    current_user_id = get_jwt_identity()
    tweet = Tweet.query.get_or_404(tweet_id)

    try:
        like = Like.query.filter_by(
            user_id=current_user_id,
            tweet_id=tweet_id
        ).first()

        if not like:
            return jsonify({'error': 'Tweet not liked'}), 400

        db.session.delete(like)
        db.session.commit()

        return jsonify({
            'message': 'Tweet unliked successfully',
            'likes_count': len(tweet.likes)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)