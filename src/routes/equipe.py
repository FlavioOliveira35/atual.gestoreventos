from flask import Blueprint, request, jsonify
from src.models import db
from src.models.equipe import Equipe
from src.auth import token_required

equipe_bp = Blueprint('equipe', __name__)

@equipe_bp.route('/equipes', methods=['GET'])
@token_required
def get_equipes(current_user):
    equipes = Equipe.query.order_by(Equipe.name).all()
    return jsonify([e.to_dict() for e in equipes])

@equipe_bp.route('/equipes', methods=['POST'])
@token_required
def create_equipe(current_user):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Nome é obrigatório'}), 400

    if Equipe.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Equipe com este nome já existe'}), 409

    equipe = Equipe(name=data['name'])
    db.session.add(equipe)
    db.session.commit()
    return jsonify(equipe.to_dict()), 201

@equipe_bp.route('/equipes/<int:equipe_id>', methods=['DELETE'])
@token_required
def delete_equipe(current_user, equipe_id):
    equipe = Equipe.query.get_or_404(equipe_id)
    db.session.delete(equipe)
    db.session.commit()
    return '', 204
