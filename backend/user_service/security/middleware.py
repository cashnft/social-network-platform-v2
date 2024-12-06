from flask import request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
import re


def setup_security(app):
    # HTTPS via Flask-Talisman
    Talisman(app, force_https=True)

    # Rate limiting setup (adjusted for updated Flask-Limiter API)
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )
    limiter.init_app(app)  # Attach the limiter to the Flask app

    # Define pre-request security checks
    @app.before_request
    def security_checks():
        # CSRF protection
        if request.method in ["POST", "PUT", "DELETE"]:
            token = request.headers.get('X-CSRF-TOKEN')
            if not token:
                return jsonify({'error': 'CSRF token missing'}), 403

        # JWT validation
        if not request.path.startswith('/auth'):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'Authorization required'}), 401

    return limiter


def validate_input(data, rules):
    """
    Validates input data against a set of rules.

    :param data: The data to validate
    :param rules: A dictionary of field names and their corresponding validation rules
    :return: A list of validation errors, if any
    """
    errors = []
    for field, validators in rules.items():
        value = data.get(field, '')
        for validator in validators:
            if not validator['check'](value):
                errors.append(f"{field}: {validator['message']}")
    return errors


# Common validation rules
EMAIL_REGEX = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')
validation_rules = {
    'email': [
        {'check': lambda x: EMAIL_REGEX.match(x), 'message': 'Invalid email format'}
    ],
    'password': [
        {'check': lambda x: len(x) >= 8, 'message': 'Password must be at least 8 characters'},
        {'check': lambda x: any(c.isupper() for c in x), 'message': 'Password must contain uppercase'}
    ]
}
