from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.orm import joinedload
from sqlalchemy import cast, Date
from src.extensions import db, scheduler
from src.models.evento import Evento
from src.models.notification_setting import NotificationSetting
from src.models.email_recipient import EmailRecipient
from src.auth import token_required
from datetime import datetime
from src.routes.utils import get_filtered_query
from src.email_service import send_email
from flask import render_template

def generate_email_summary(evento, previous_status=None, current_user=None, manual_send=False):
    # --- Cálculos de Data e Duração ---
    now = datetime.utcnow()
    data_formatada = evento.data.strftime('%d/%m/%Y às %H:%M')
    duracao_aberto_str = ""
    if evento.status != 'Encerrado':
        delta = now - evento.data
        dias = delta.days
        horas, rem = divmod(delta.seconds, 3600)
        minutos, _ = divmod(rem, 60)
        if dias > 0:
            duracao_aberto_str = f"há {dias} dia(s) e {horas} hora(s)"
        else:
            duracao_aberto_str = f"há {horas} hora(s) e {minutos} minuto(s)"

    # --- Nomes com Fallback ---
    solicitante_nome = evento.solicitante.name if evento.solicitante else 'N/A'
    cidade_nome = evento.city.name if evento.city else 'N/A'
    updater_nome = evento.updater.username if evento.updater else 'N/A'
    creator_nome = evento.creator.username if evento.creator else 'N/A'

    # --- Geração do Texto ---
    if manual_send:
        return f"Atenção! Foi solicitado um alerta manual para o evento <strong>{evento.oc}</strong>. O status atual é '{evento.status}'. Este evento foi aberto por {creator_nome} e está aberto {duracao_aberto_str}."

    if evento.status == 'Encerrado' and previous_status != 'Encerrado':
        duracao_total_str = "duração indisponível"
        if evento.data_encerramento:
            delta_total = evento.data_encerramento - evento.data
            total_seconds = delta_total.total_seconds()
            horas, rem = divmod(total_seconds, 3600)
            duracao_total_str = f"{int(horas)} hora(s)"
        return f"O evento <strong>{evento.oc}</strong> foi finalizado com sucesso em {cidade_nome} por <strong>{updater_nome}</strong>. O evento, aberto por {creator_nome}, teve uma duração total de <strong>{duracao_total_str}</strong>."

    if previous_status is None:
        return f"Um novo evento de alto impacto foi aberto em <strong>{cidade_nome}</strong> com a ocorrência <strong>{evento.oc}</strong>. O evento foi registrado por <strong>{creator_nome}</strong> em {data_formatada}, com uma afetação inicial de <strong>{evento.afetacao}</strong> clientes."

    if evento.status != previous_status:
        return f"O evento <strong>{evento.oc}</strong> em {cidade_nome} teve seu status alterado de '{previous_status}' para '<strong>{evento.status}</strong>' por <strong>{updater_nome}</strong>. O evento está aberto {duracao_aberto_str}."

    return f"O evento <strong>{evento.oc}</strong> em {cidade_nome} foi atualizado por <strong>{updater_nome}</strong>. O status continua '{evento.status}' e está aberto {duracao_aberto_str}."


def handle_notification_logic(evento, previous_status=None, current_user=None):
    setting = NotificationSetting.query.filter_by(key='afetacao_threshold').first()
    threshold = int(setting.value) if setting else 300

    try:
        afetacao_value = int(evento.afetacao) if evento.afetacao and evento.afetacao.isdigit() else 0
    except (ValueError, TypeError):
        afetacao_value = 0

    job_id = f'evento_{evento.id}'

    # Se o status mudou para "Encerrado"
    if evento.status == 'Encerrado' and previous_status != 'Encerrado':
        if scheduler.get_job(job_id):
            scheduler.remove_job(job_id)
            print(f"Job {job_id} removido.")

        recipients = EmailRecipient.query.filter_by(city_id=evento.city_id).all()
        if recipients:
            to = [r.email for r in recipients]
            subject = f"Atualização de Evento: {evento.oc} - {evento.status}"
            summary = generate_email_summary(evento, previous_status)
            comments = evento.comentarios.order_by(db.desc('created_at')).all()

            html = render_template('email/professional_alert.html', evento=evento, summary_text=summary, comments=comments)
            send_email(to, subject, html)
        return

    # Se a afetação é maior que o threshold
    if afetacao_value > threshold:
        recipients = EmailRecipient.query.filter_by(city_id=evento.city_id).all()
        if not recipients:
            return

        to = [r.email for r in recipients]

        def email_job():
            with current_app.app_context():
                current_evento = Evento.query.get(evento.id)
                if not current_evento or current_evento.status == 'Encerrado':
                    if scheduler.get_job(job_id):
                        scheduler.remove_job(job_id)
                    return

                subject = f"Alerta de Evento Crítico: {current_evento.oc}"
                summary = generate_email_summary(current_evento, previous_status)
                comments = current_evento.comentarios.order_by(db.desc('created_at')).all()

                html = render_template('email/professional_alert.html', evento=current_evento, summary_text=summary, comments=comments)
                send_email(to, subject, html)

        # Se o job não existe, cria um
        if not scheduler.get_job(job_id):
            with current_app.app_context():
                email_job() # Envia o primeiro e-mail imediatamente

            scheduler.add_job(id=job_id, func=email_job, trigger='interval', hours=2)
            print(f"Job {job_id} agendado.")

evento_bp = Blueprint('evento', __name__)

@evento_bp.route('/eventos', methods=['GET'])
@token_required
def get_eventos(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 100, type=int)

    query = get_filtered_query(current_user)

    pagination = query.order_by(Evento.data.desc()).paginate(page=page, per_page=per_page, error_out=False)

    eventos = pagination.items

    return jsonify({
        'eventos': [evento.to_dict() for evento in eventos],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    })

@evento_bp.route('/eventos', methods=['POST'])
@token_required
def create_evento(current_user):
    try:
        data = request.get_json()
        
        if not data or not data.get('data') or not data.get('oc') or not data.get('solicitante_id'):
            return jsonify({'error': 'Campos obrigatórios faltando'}), 400

        data_obj = datetime.strptime(data['data'], '%Y-%m-%dT%H:%M')
        
        evento = Evento(
            data=data_obj,
            oc=data['oc'],
            status=data.get('status', 'Pendente'),
            sp=data.get('sp'),
            caixa=data.get('caixa'),
            ta=data.get('ta'),
            afetacao=data.get('afetacao'),
            rede=data.get('rede'),
            pon=data.get('pon'),
            ospregional=data.get('ospregional'),
            city_id=data.get('city_id'),
            ard_id=data.get('ard_id'),
            solicitante_id=data.get('solicitante_id'),
            equipe_id=data.get('equipe_id'),
            created_by_user_id=current_user.id,
            updated_by_user_id=current_user.id
        )
        
        db.session.add(evento)
        db.session.commit()

        handle_notification_logic(evento, current_user=current_user)
        
        return jsonify(evento.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@evento_bp.route('/eventos/<int:evento_id>', methods=['PUT'])
@token_required
def update_evento(current_user, evento_id):
    try:
        evento = Evento.query.get_or_404(evento_id)
        data = request.get_json()
        
        previous_status = evento.status

        if 'data' in data and data['data']:
            evento.data = datetime.strptime(data['data'], '%Y-%m-%dT%H:%M')
        
        # Atualiza outros campos
        for field in ['oc', 'status', 'sp', 'caixa', 'ta', 'afetacao', 'rede', 'pon', 'ospregional',
                      'city_id', 'ard_id', 'solicitante_id', 'equipe_id']:
            if field in data:
                setattr(evento, field, data.get(field))

        # Lógica para data de encerramento
        if data.get('status') == 'Encerrado':
            if 'data_encerramento' in data and data['data_encerramento']:
                evento.data_encerramento = datetime.strptime(data['data_encerramento'], '%Y-%m-%dT%H:%M')
            else:
                return jsonify({'error': 'A data de encerramento é obrigatória quando o status é "Encerrado"'}), 400
        else:
            evento.data_encerramento = None

        evento.updated_at = datetime.utcnow()
        evento.updated_by_user_id = current_user.id
        
        db.session.commit()

        handle_notification_logic(evento, previous_status, current_user=current_user)
        
        return jsonify(evento.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@evento_bp.route('/eventos/<int:evento_id>', methods=['DELETE'])
@token_required
def delete_evento(current_user, evento_id):
    try:
        evento = Evento.query.get_or_404(evento_id)
        db.session.delete(evento)
        db.session.commit()
        
        return jsonify({'message': 'Evento deletado com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@evento_bp.route('/eventos/<int:evento_id>', methods=['GET'])
@token_required
def get_evento(current_user, evento_id):
    try:
        evento = Evento.query.options(
            joinedload(Evento.city),
            joinedload(Evento.ard),
            joinedload(Evento.solicitante),
            joinedload(Evento.equipe)
        ).get_or_404(evento_id)
        return jsonify(evento.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@evento_bp.route('/eventos/<int:evento_id>/send_email', methods=['POST'])
@token_required
def send_manual_email(current_user, evento_id):
    try:
        evento = Evento.query.get_or_404(evento_id)

        recipients = EmailRecipient.query.filter_by(city_id=evento.city_id).all()
        if not recipients:
            return jsonify({'error': 'Nenhum destinatário de e-mail configurado para esta cidade.'}), 404

        to = [r.email for r in recipients]
        subject = f"Alerta Manual de Evento: {evento.oc}"

        summary = generate_email_summary(evento, manual_send=True, current_user=current_user)
        comments = evento.comentarios.order_by(db.desc('created_at')).all()

        html = render_template('email/professional_alert.html', evento=evento, summary_text=summary, comments=comments)

        if send_email(to, subject, html):
            return jsonify({'message': 'E-mail enviado com sucesso.'})
        else:
            return jsonify({'error': 'Falha ao enviar e-mail.'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500
