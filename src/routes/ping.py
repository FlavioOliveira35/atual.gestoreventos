from flask import Blueprint, jsonify

ping_bp = Blueprint('ping_bp', __name__)

@ping_bp.route('/ping')
def ping():
    """
    Endpoint para verificar se a aplicação está ativa.
    Útil para serviços de monitoramento como Uptime Robot.
    """
    return jsonify({"status": "ok"}), 200
