from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from sqlalchemy import or_, func
from datetime import datetime
import os
from security.middleware import setup_security, validate_input, validation_rules

app = Flask(__name__)
limiter = setup_security(app)


#config
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/chirper_search')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', '')

#init the extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

#models
class SearchIndex(db.Model):
    __tablename__ = 'search_index'

    id = db.Column(db.Integer, primary_key=True)
    content_type = db.Column(db.String(50), nullable=False)  
    content_id = db.Column(db.Integer, nullable=False)
    text = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    engagement_score = db.Column(db.Float, default=0.0)  # For ranking results
    
    
    __table_args__ = (
        db.Index('idx_content_type_id', 'content_type', 'content_id'),
        db.Index('idx_text_gin', 'text', postgresql_using='gin'),
    )

#routes
@app.route('/search', methods=['GET'])
@jwt_required()
def search():
    query = request.args.get('q', '').strip()
    content_type = request.args.get('type', 'all')  
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    if not query:
        return jsonify({
            'error': 'Search query is required'
        }), 400

    try:
        search_query = SearchIndex.query

        #filter by content type
        if content_type != 'all':
            search_query = search_query.filter_by(content_type=content_type)

      
        search_terms = ' | '.join(query.split())
        search_query = search_query.filter(
            func.to_tsvector('english', SearchIndex.text).match(
                func.to_tsquery('english', search_terms)
            )
        )

      
        search_query = search_query.order_by(
            func.ts_rank(
                func.to_tsvector('english', SearchIndex.text),
                func.to_tsquery('english', search_terms)
            ).desc(),
            SearchIndex.engagement_score.desc()
        )

 
        results = search_query.paginate(page=page, per_page=per_page)

        return jsonify({
            'results': [{
                'id': item.content_id,
                'type': item.content_type,
                'text': item.text,
                'user_id': item.user_id,
                'created_at': item.created_at.isoformat(),
                'score': item.engagement_score
            } for item in results.items],
            'total': results.total,
            'pages': results.pages,
            'current_page': results.page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search/index', methods=['POST'])
def index_content():
    data = request.get_json()
    required_fields = ['content_type', 'content_id', 'text', 'user_id']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    try:
      
        index_item = SearchIndex.query.filter_by(
            content_type=data['content_type'],
            content_id=data['content_id']
        ).first()

        if index_item:
            index_item.text = data['text']
            index_item.engagement_score = data.get('engagement_score', 0.0)
        else:
            index_item = SearchIndex(
                content_type=data['content_type'],
                content_id=data['content_id'],
                text=data['text'],
                user_id=data['user_id'],
                engagement_score=data.get('engagement_score', 0.0)
            )
            db.session.add(index_item)

        db.session.commit()

        return jsonify({
            'message': 'Content indexed successfully',
            'index_id': index_item.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/search/index/<string:content_type>/<int:content_id>', methods=['DELETE'])
def remove_from_index(content_type, content_id):
    try:
        index_item = SearchIndex.query.filter_by(
            content_type=content_type,
            content_id=content_id
        ).first()

        if not index_item:
            return jsonify({'error': 'Content not found in index'}), 404

        db.session.delete(index_item)
        db.session.commit()

        return jsonify({
            'message': 'Content removed from index successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/search/trending', methods=['GET'])
def get_trending():
    content_type = request.args.get('type', 'tweets')
    limit = request.args.get('limit', 10, type=int)

    try:
        trending = SearchIndex.query\
            .filter_by(content_type=content_type)\
            .order_by(SearchIndex.engagement_score.desc())\
            .limit(limit)\
            .all()

        return jsonify({
            'trending': [{
                'id': item.content_id,
                'type': item.content_type,
                'text': item.text,
                'user_id': item.user_id,
                'score': item.engagement_score
            } for item in trending]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search/hashtags', methods=['GET'])
def search_hashtags():
    query = request.args.get('q', '').strip()
    limit = request.args.get('limit', 10, type=int)

    if not query:
        return jsonify({
            'error': 'Hashtag query is required'
        }), 400

    try:
       
        hashtag_pattern = f"%#{query}%"
        hashtags = db.session.query(
            func.regexp_matches(SearchIndex.text, '#\\w+', 'g').label('hashtag'),
            func.count('*').label('count')
        )\
        .filter(SearchIndex.content_type == 'tweet')\
        .filter(SearchIndex.text.ilike(hashtag_pattern))\
        .group_by('hashtag')\
        .order_by(func.count('*').desc())\
        .limit(limit)\
        .all()

        return jsonify({
            'hashtags': [{
                'tag': tag[0],
                'count': count
            } for tag, count in hashtags]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True)