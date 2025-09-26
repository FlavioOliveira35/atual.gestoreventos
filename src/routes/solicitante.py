from flask import Blueprint, request, jsonify
from src.models import db
from src.models.solicitante import Solicitante
from src.auth import token_required

solicitante_bp = Blueprint('solicitante', __name__)

@solicitante_bp.route('/solicitantes', methods=['GET'])
@token_required
def get_solicitantes(current_user):
    solicitantes = Solicitante.query.order_by(Solicitante.name).all()
    return jsonify([s.to_dict() for s in solicitantes])

@solicitante_bp.route('/solicitantes', methods=['POST'])
@token_required
def create_solicitante(current_user):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Nome é obrigatório'}), 400

    if Solicitante.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Solicitante com este nome já existe'}), 409

    solicitante = Solicitante(name=data['name'])
    db.session.add(solicitante)
    db.session.commit()
    return jsonify(solicitante.to_dict()), 201

@solicitante_bp.route('/solicitantes/<int:solicitante_id>', methods=['DELETE'])
@token_required
def delete_solicitante(current_user, solicitante_id):
    solicitante = Solicitante.query.get_or_404(solicitante_id)
    db.session.delete(solicitante)
    db.session.commit()
    return '', 204
