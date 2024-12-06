from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from datetime import datetime
import enum
import os

from security.middleware import setup_security, validate_input, validation_rules

app = Flask(__name__)
limiter = setup_security(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/chirper_notifications')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', '')

db = SQLAlchemy(app)
jwt = JWTManager(app)


class NotificationType(enum.Enum):
    LIKE = 'like'
    FOLLOW = 'follow'
    MENTION = 'mention'
    REPLY = 'reply'


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, nullable=False)
    sender_id = db.Column(db.Integer, nullable=False)
    type = db.Column(db.Enum(NotificationType), nullable=False)
    content = db.Column(db.String(500), nullable=False)
    reference_id = db.Column(db.Integer)  
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type.value,
            'content': self.content,
            'sender_id': self.sender_id,
            'reference_id': self.reference_id,
            'read': self.read,
            'created_at': self.created_at.isoformat()
        }

# Routes
@app.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    unread_only = request.args.get('unread', False, type=bool)

    query = Notification.query.filter_by(recipient_id=current_user_id)
    
    if unread_only:
        query = query.filter_by(read=False)

    notifications = query.order_by(Notification.created_at.desc())\
        .paginate(page=page, per_page=per_page)

    return jsonify({
        'notifications': [notif.to_dict() for notif in notifications.items],
        'total': notifications.total,
        'pages': notifications.pages,
        'current_page': notifications.page,
        'unread_count': Notification.query.filter_by(
            recipient_id=current_user_id, 
            read=False
        ).count()
    }), 200

@app.route('/notifications/create', methods=['POST'])
def create_notification():
    data = request.get_json()
    required_fields = ['recipient_id', 'sender_id', 'type', 'content']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        notification = Notification(
            recipient_id=data['recipient_id'],
            sender_id=data['sender_id'],
            type=NotificationType[data['type'].upper()],
            content=data['content'],
            reference_id=data.get('reference_id')
        )
        
        db.session.add(notification)
        db.session.commit()

        # In a real app, we would emit a WebSocket event here
        return jsonify({
            'message': 'Notification created successfully',
            'notification': notification.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/notifications/mark-read', methods=['POST'])
@jwt_required()
def mark_notifications_read():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    # Can mark specific notifications or all notifications as read
    notification_ids = data.get('notification_ids', [])
    
    try:
        query = Notification.query.filter_by(
            recipient_id=current_user_id,
            read=False
        )
        
        if notification_ids:
            query = query.filter(Notification.id.in_(notification_ids))
            
        notifications = query.all()
        for notification in notifications:
            notification.read = True
            
        db.session.commit()
        
        return jsonify({
            'message': 'Notifications marked as read',
            'count': len(notifications)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    current_user_id = get_jwt_identity()
    
    count = Notification.query.filter_by(
        recipient_id=current_user_id,
        read=False
    ).count()
    
    return jsonify({
        'unread_count': count
    }), 200

@app.route('/notifications/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    current_user_id = get_jwt_identity()
    notification = Notification.query.get_or_404(notification_id)
    
    if notification.recipient_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    try:
        db.session.delete(notification)
        db.session.commit()
        return jsonify({'message': 'Notification deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)