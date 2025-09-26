from . import db

class Equipe(db.Model):
    __tablename__ = 'equipe'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)

    def __repr__(self):
        return f'<Equipe {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }
