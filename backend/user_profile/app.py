from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os

app = Flask(__name__)

#Cinug
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/chirper_users')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', '')  # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

#init the extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

#mmodels
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.String(160))
    avatar_url = db.Column(db.String(255))
    location = db.Column(db.String(100))
    website = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(self, username, email, password, name):
        self.username = username
        self.email = email
        self.password_hash = generate_password_hash(password)
        self.name = name

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name,
            'bio': self.bio,
            'avatar_url': self.avatar_url,
            'location': self.location,
            'website': self.website,
            'created_at': self.created_at.isoformat()
        }

#f ollwers table
followers = db.Table('followers',
    db.Column('follower_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('followed_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)

@app.route('/users/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    
    required_fields = ['username', 'email', 'password', 'name']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    #check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    try:
        user = User(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            name=data['name']
        )
        db.session.add(user)
        db.session.commit()

        #create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict(),
            'token': access_token
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/users/auth/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    access_token = create_access_token(identity=str(user.id))  # Convert to string here
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'token': access_token
    }), 200

@app.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    print(current_user_id)
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(user.to_dict()), 200

@app.route('/users/<username>', methods=['GET'])
def get_user_profile(username):
    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify(user.to_dict()), 200

@app.route('/users/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    data = request.get_json()

    updatable_fields = ['name', 'bio', 'location', 'website', 'avatar_url']
    
    try:
        for field in updatable_fields:
            if field in data:
                setattr(user, field, data[field])
        
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/users/<username>/follow', methods=['POST'])
@jwt_required()
def follow_user(username):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    user_to_follow = User.query.filter_by(username=username).first()

    if not user_to_follow:
        return jsonify({'error': 'User not found'}), 404

    if current_user.id == user_to_follow.id:
        return jsonify({'error': 'Cannot follow yourself'}), 400


    stmt = followers.select().where(
        followers.c.follower_id == current_user.id,
        followers.c.followed_id == user_to_follow.id
    )
    is_following = db.session.execute(stmt).first() is not None

    if is_following:
        return jsonify({'error': 'Already following this user'}), 400

    try:
        db.session.execute(
            followers.insert().values(
                follower_id=current_user.id,
                followed_id=user_to_follow.id
            )
        )
        db.session.commit()
        return jsonify({'message': f'Now following {username}'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=True)