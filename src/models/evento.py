from datetime import datetime
from . import db

class Evento(db.Model):
    __tablename__ = 'gestor'
    
    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.DateTime, nullable=False)
    oc = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pendente')

    sp = db.Column(db.String(100), nullable=True)
    caixa = db.Column(db.String(100), nullable=True)
    ta = db.Column(db.String(100), nullable=True)
    afetacao = db.Column(db.String(100), nullable=True)
    rede = db.Column(db.String(100), nullable=True)
    pon = db.Column(db.String(100), nullable=True)
    ospregional = db.Column(db.String(100), nullable=True)
    data_encerramento = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Chaves estrangeiras
    city_id = db.Column(db.Integer, db.ForeignKey('city.id'), nullable=True)
    ard_id = db.Column(db.Integer, db.ForeignKey('ard.id'), nullable=True)
    solicitante_id = db.Column(db.Integer, db.ForeignKey('solicitante.id'), nullable=True)
    equipe_id = db.Column(db.Integer, db.ForeignKey('equipe.id'), nullable=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    updated_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)

    # Relacionamentos
    city = db.relationship('City', backref=db.backref('eventos', lazy='subquery'))
    ard = db.relationship('ARD', backref=db.backref('eventos', lazy='subquery'))
    solicitante = db.relationship('Solicitante', backref=db.backref('eventos', lazy='subquery'))
    equipe = db.relationship('Equipe', backref=db.backref('eventos', lazy='subquery'))
    creator = db.relationship('User', foreign_keys=[created_by_user_id])
    updater = db.relationship('User', foreign_keys=[updated_by_user_id])
    comentarios = db.relationship('Comentario', backref='evento', lazy='dynamic', cascade="all, delete-orphan")

    @property
    def has_comments(self):
        return self.comentarios.count() > 0

    def __repr__(self):
        return f'<Evento {self.oc}>'

    def to_dict(self):
        return {
            'id': self.id,
            'data': f"{self.data.isoformat()}Z" if self.data else None,
            'oc': self.oc,
            'status': self.status,
            'sp': self.sp,
            'caixa': self.caixa,
            'ta': self.ta,
            'afetacao': self.afetacao,
            'rede': self.rede,
            'pon': self.pon,
            'ospregional': self.ospregional,
            'created_at': f"{self.created_at.isoformat()}Z" if self.created_at else None,
            'updated_at': f"{self.updated_at.isoformat()}Z" if self.updated_at else None,

            'city_id': self.city_id,
            'city_name': self.city.name if self.city else None,

            'ard_id': self.ard_id,
            'ard_name': self.ard.name if self.ard else None,

            'solicitante_id': self.solicitante_id,
            'solicitante_name': self.solicitante.name if self.solicitante else None,

            'equipe_id': self.equipe_id,
            'equipe_name': self.equipe.name if self.equipe else None,

            'created_by': self.creator.username if self.creator else None,
            'updated_by': self.updater.username if self.updater else None,

            'data_encerramento': f"{self.data_encerramento.isoformat()}Z" if self.data_encerramento else None,
            'has_comments': self.has_comments,

            # Campos de depuração temporários
            'debug_closure_date_raw': str(self.data_encerramento) if self.data_encerramento else None
        }
