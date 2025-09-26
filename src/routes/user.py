from flask import Blueprint, jsonify, request, current_app
from src.models.user import User
from src.models.city import City
from src.models import db
from src.auth import token_required
import jwt
from datetime import datetime, timedelta

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
@token_required
def get_users(current_user):
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")
        return jsonify({'token': token, 'user': user.to_dict()})

    return jsonify({'message': 'Credenciais inválidas'}), 401

@user_bp.route('/users', methods=['POST'])
@token_required
def create_user(current_user):
    data = request.json
    user = User(
        username=data['username'],
        email=data['email'],
        created_by_user=data.get('created_by_user'),
        is_readonly=data.get('is_readonly', False)
    )
    user.set_password(data['password'])

    city_ids = data.get('city_ids', [])
    if city_ids:
        cities = City.query.filter(City.id.in_(city_ids)).all()
        user.cities = cities

    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    user.is_readonly = data.get('is_readonly', user.is_readonly)

    if 'password' in data and data['password']:
        user.set_password(data['password'])

    if 'city_ids' in data:
        city_ids = data.get('city_ids', [])
        cities = City.query.filter(City.id.in_(city_ids)).all()
        user.cities = cities

    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/me/preferences', methods=['PUT'])
@token_required
def update_user_preferences(current_user):
    data = request.get_json()
    if 'filter_preferences' in data:
        current_user.filter_preferences = data['filter_preferences']
        db.session.commit()
        return jsonify({'message': 'Preferências atualizadas com sucesso!'})
    return jsonify({'message': 'Nenhuma preferência fornecida'}), 400

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user, user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
