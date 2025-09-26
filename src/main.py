import os
import sys
from urllib.parse import quote_plus

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.extensions import db, mail, scheduler
from src.models.user import User # Import models after db is defined

# Import Blueprints
from src.routes.evento import evento_bp
from src.routes.user import user_bp
from src.routes.city import city_bp
from src.routes.ard import ard_bp
from src.routes.equipe import equipe_bp
from src.routes.solicitante import solicitante_bp
from src.routes.comentario import comentario_bp
from src.routes.ping import ping_bp
from src.routes.export import export_bp
from src.routes.notification import notification_bp

def create_app():
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

    # --- Configuration ---
    app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

    # Mail Configuration from Environment Variables
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'in-v3.mailjet.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', '1', 't']
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '17ed0cb6913dd689f74511e67578a754')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '705c6f263bf9296f958e1412e99c413d')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'geradoretiquetas@gmail.com')

    # Database Configuration
    senha = quote_plus("OV5R6c78BTWAozPb")
    DATABASE_URL = f"postgresql://postgres.dsmgyhlijhztonfjfbgz:{senha}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # --- Initialize Extensions ---
    CORS(app)
    db.init_app(app)
    mail.init_app(app)
    scheduler.init_app(app)
    if not scheduler.running:
        scheduler.start()

    # --- Register Blueprints ---
    app.register_blueprint(evento_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(city_bp, url_prefix='/api')
    app.register_blueprint(ard_bp, url_prefix='/api')
    app.register_blueprint(equipe_bp, url_prefix='/api')
    app.register_blueprint(solicitante_bp, url_prefix='/api')
    app.register_blueprint(comentario_bp, url_prefix='/api')
    app.register_blueprint(ping_bp, url_prefix='/api')
    app.register_blueprint(export_bp, url_prefix='/api')
    app.register_blueprint(notification_bp, url_prefix='/api')

    return app

app = create_app()

# --- Static File Serving ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

def setup_database(app_instance):
    with app_instance.app_context():
        db.create_all()
        print("Tabelas criadas com sucesso!")

        # Add default user if not exists
        if not User.query.filter_by(email='flavio.coliveira@telefonica.com').first():
            user = User(
                username='Flavio Oliveira',
                email='flavio.coliveira@telefonica.com',
            )
            user.set_password('465465')
            db.session.add(user)
            db.session.commit()
            print("Usuário padrão adicionado com sucesso!")

if __name__ == '__main__':
    setup_database(app)
    app.run(host='0.0.0.0', port=5000, debug=True)
