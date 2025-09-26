from . import db

class Solicitante(db.Model):
    __tablename__ = 'solicitante'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)

    def __repr__(self):
        return f'<Solicitante {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }
