from . import db
from datetime import datetime

class CommentReadStatus(db.Model):
    __tablename__ = 'comment_read_status'

    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('gestor.id', ondelete='CASCADE'), primary_key=True)
    last_read_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User')
    evento = db.relationship('Evento')

    def __repr__(self):
        return f'<CommentReadStatus user:{self.user_id} evento:{self.evento_id}>'