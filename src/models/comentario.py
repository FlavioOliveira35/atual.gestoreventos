from datetime import datetime
from . import db

class Comentario(db.Model):
    __tablename__ = 'comentario'

    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    evento_id = db.Column(db.Integer, db.ForeignKey('gestor.id'), nullable=False)

    user = db.relationship('User', back_populates='comentarios')

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'created_at': f"{self.created_at.isoformat()}Z" if self.created_at else None,
            'user_id': self.user_id,
            'user_name': self.user.username if self.user else 'Usuário desconhecido',
            'evento_id': self.evento_id
        }
