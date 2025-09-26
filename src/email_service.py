from src.extensions import mail
from flask_mail import Message
from flask import current_app

def send_email(to, subject, html):
    try:
        app = current_app._get_current_object()
        msg = Message(
            subject,
            recipients=to,
            html=html,
            sender=app.config['MAIL_DEFAULT_SENDER']
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"ERRO DETALHADO NO ENVIO DE E-MAIL: {e}")
        raise e
