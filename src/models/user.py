from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import Text

# Tabela de associação para a relação muitos-para-muitos entre User e City
user_cities = db.Table('user_cities',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('city_id', db.Integer, db.ForeignKey('city.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    created_by_user = db.Column(db.String(80))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    filter_preferences = db.Column(Text) # Para armazenar JSON com preferências de filtro

    # Relação muitos-para-muitos com City
    cities = db.relationship('City', secondary=user_cities, lazy='subquery',
        backref=db.backref('users', lazy=True))

    comentarios = db.relationship('Comentario', back_populates='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_by_user': self.created_by_user,
            'created_at': f"{self.created_at.isoformat()}Z" if self.created_at else None,
            'cities': [city.to_dict() for city in self.cities],
            'filter_preferences': self.filter_preferences
        }
