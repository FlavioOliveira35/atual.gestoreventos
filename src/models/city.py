from . import db

class City(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    state = db.Column(db.String(2), nullable=True)  # Adicionando o campo de estado

    def __repr__(self):
        return f'<City {self.name} - {self.state}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'state': self.state  # Adicionando o estado ao dicionário
        }
