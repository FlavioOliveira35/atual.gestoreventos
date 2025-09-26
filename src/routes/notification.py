from flask import Blueprint, request, jsonify
from src.models import db
from src.models.notification_setting import NotificationSetting
from src.models.email_recipient import EmailRecipient
from src.auth import token_required

notification_bp = Blueprint('notification', __name__)

# --- Threshold ---
@notification_bp.route('/notification/settings/threshold', methods=['GET'])
@token_required
def get_threshold(current_user):
    setting = NotificationSetting.query.filter_by(key='afetacao_threshold').first()
    if setting:
        return jsonify({'threshold': setting.value})
    return jsonify({'threshold': '300'}) # Default value

@notification_bp.route('/notification/settings/threshold', methods=['POST'])
@token_required
def set_threshold(current_user):
    data = request.get_json()
    new_value = data.get('threshold')
    if not new_value or not new_value.isdigit():
        return jsonify({'error': 'Valor inválido'}), 400

    setting = NotificationSetting.query.filter_by(key='afetacao_threshold').first()
    if setting:
        setting.value = new_value
    else:
        setting = NotificationSetting(key='afetacao_threshold', value=new_value)
        db.session.add(setting)

    db.session.commit()
    return jsonify({'message': 'Limiar atualizado com sucesso'})

# --- Email Recipients ---
@notification_bp.route('/notification/recipients', methods=['GET'])
@token_required
def get_recipients(current_user):
    city_id = request.args.get('city_id')
    if not city_id:
        return jsonify({'error': 'City ID é obrigatório'}), 400

    recipients = EmailRecipient.query.filter_by(city_id=city_id).all()
    return jsonify([r.to_dict() for r in recipients])

@notification_bp.route('/notification/recipients', methods=['POST'])
@token_required
def add_recipient(current_user):
    data = request.get_json()
    email = data.get('email')
    city_id = data.get('city_id')

    if not email or not city_id:
        return jsonify({'error': 'Email e City ID são obrigatórios'}), 400

    # Evitar duplicados
    if EmailRecipient.query.filter_by(email=email, city_id=city_id).first():
        return jsonify({'error': 'Este e-mail já está cadastrado para esta cidade'}), 409

    recipient = EmailRecipient(email=email, city_id=city_id)
    db.session.add(recipient)
    db.session.commit()

    return jsonify(recipient.to_dict()), 201

@notification_bp.route('/notification/recipients/<int:recipient_id>', methods=['DELETE'])
@token_required
def delete_recipient(current_user, recipient_id):
    recipient = EmailRecipient.query.get_or_404(recipient_id)
    db.session.delete(recipient)
    db.session.commit()
    return jsonify({'message': 'E-mail removido com sucesso'})
