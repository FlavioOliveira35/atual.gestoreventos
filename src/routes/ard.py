from flask import Blueprint, request, jsonify
from src.models import db
from src.models.ard import ARD
from src.auth import token_required

ard_bp = Blueprint('ard', __name__)

@ard_bp.route('/ards', methods=['GET'])
@token_required
def get_ards(current_user):
    city_id_filter = request.args.get('city_id')
    query = ARD.query
    if city_id_filter:
        query = query.filter_by(city_id=city_id_filter)

    ards = query.order_by(ARD.name).all()
    return jsonify([ard.to_dict() for ard in ards])

@ard_bp.route('/ards', methods=['POST'])
@token_required
def create_ard(current_user):
    data = request.get_json()
    if not data or not data.get('name') or not data.get('city_id'):
        return jsonify({'error': 'Nome e city_id são obrigatórios'}), 400

    if ARD.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'ARD com este nome já existe'}), 409

    ard = ARD(name=data['name'], city_id=data['city_id'])
    db.session.add(ard)
    db.session.commit()
    return jsonify(ard.to_dict()), 201

@ard_bp.route('/ards/<int:ard_id>', methods=['DELETE'])
@token_required
def delete_ard(current_user, ard_id):
    ard = ARD.query.get_or_404(ard_id)
    db.session.delete(ard)
    db.session.commit()
    return '', 204
