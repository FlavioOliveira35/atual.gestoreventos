from flask import Blueprint, jsonify, request
from src.models.city import City
from src.models import db
from src.auth import token_required

city_bp = Blueprint('city', __name__)

@city_bp.route('/cities', methods=['GET'])
@token_required
def get_cities(current_user):
    cities = City.query.all()
    return jsonify([city.to_dict() for city in cities])

@city_bp.route('/cities', methods=['POST'])
@token_required
def create_city(current_user):
    data = request.json
    city = City(name=data['name'])
    db.session.add(city)
    db.session.commit()
    return jsonify(city.to_dict()), 201

@city_bp.route('/cities/<int:city_id>', methods=['DELETE'])
@token_required
def delete_city(current_user, city_id):
    city = City.query.get_or_404(city_id)
    db.session.delete(city)
    db.session.commit()
    return '', 204
