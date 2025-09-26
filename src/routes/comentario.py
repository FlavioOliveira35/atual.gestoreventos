from flask import Blueprint, request, jsonify
from src.models import db
from src.models.comentario import Comentario
from src.models.comment_read_status import CommentReadStatus
from src.auth import token_required
from datetime import datetime

comentario_bp = Blueprint('comentario', __name__)

# Rota para obter comentários de um evento
@comentario_bp.route('/eventos/<int:evento_id>/comentarios', methods=['GET'])
@token_required
def get_comentarios(current_user, evento_id):
    try:
        comentarios = Comentario.query.filter_by(evento_id=evento_id).order_by(Comentario.created_at.desc()).all()
        return jsonify([c.to_dict() for c in comentarios])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Rota para adicionar um novo comentário
@comentario_bp.route('/eventos/<int:evento_id>/comentarios', methods=['POST'])
@token_required
def add_comentario(current_user, evento_id):
    try:
        data = request.get_json()
        if not data or not data.get('text'):
            return jsonify({'error': 'O texto do comentário é obrigatório'}), 400

        comentario = Comentario(
            text=data['text'],
            user_id=current_user.id,
            evento_id=evento_id
        )

        db.session.add(comentario)
        db.session.commit()

        return jsonify(comentario.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Rota para marcar comentários como lidos
@comentario_bp.route('/eventos/<int:evento_id>/comentarios/mark_read', methods=['POST'])
@token_required
def mark_comments_as_read(current_user, evento_id):
    try:
        read_status = CommentReadStatus.query.filter_by(
            user_id=current_user.id,
            evento_id=evento_id
        ).first()

        if read_status:
            read_status.last_read_at = datetime.utcnow()
        else:
            read_status = CommentReadStatus(
                user_id=current_user.id,
                evento_id=evento_id
            )
            db.session.add(read_status)

        db.session.commit()
        return jsonify({'message': 'Comentários marcados como lidos.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
