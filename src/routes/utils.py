from flask import request
from sqlalchemy import cast, Date
from sqlalchemy.orm import joinedload
from src.models import db
from src.models.evento import Evento
from src.models.ard import ARD
from src.models.solicitante import Solicitante
from src.models.equipe import Equipe
from src.models.city import City
from datetime import datetime, time

def parse_date(date_str):
    """Helper para converter string 'YYYY-MM-DD' para datetime."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        return None

def get_filtered_query(current_user):
    """
    Constrói e retorna uma query SQLAlchemy para Eventos com base nos filtros da request.
    """
    status_filter = request.args.get('status')
    search_filter = request.args.get('search')
    data_inicio_str = request.args.get('data_inicio')
    data_fim_str = request.args.get('data_fim')
    data_encerramento_inicio_str = request.args.get('data_encerramento_inicio')
    data_encerramento_fim_str = request.args.get('data_encerramento_fim')

    query = Evento.query.options(
        joinedload(Evento.city),
        joinedload(Evento.ard),
        joinedload(Evento.solicitante),
        joinedload(Evento.equipe)
    )

    user_city_ids = [city.id for city in current_user.cities]
    if user_city_ids:
        query = query.filter(Evento.city_id.in_(user_city_ids))

    if status_filter:
        statuses = status_filter.split(',')
        if statuses:
            query = query.filter(Evento.status.in_(statuses))

    if search_filter:
        search_term = f"%{search_filter}%"
        query = query.join(Evento.solicitante, isouter=True).join(Evento.ard, isouter=True).join(Evento.equipe, isouter=True).filter(
            db.or_(
                Evento.oc.ilike(search_term),
                Solicitante.name.ilike(search_term),
                ARD.name.ilike(search_term),
                Equipe.name.ilike(search_term),
                Evento.sp.ilike(search_term),
                Evento.caixa.ilike(search_term),
                Evento.ta.ilike(search_term)
            )
        )

    data_inicio = parse_date(data_inicio_str)
    data_fim = parse_date(data_fim_str)
    if data_inicio:
        query = query.filter(cast(Evento.data, Date) >= data_inicio)
    if data_fim:
        query = query.filter(cast(Evento.data, Date) <= data_fim)

    data_encerramento_inicio = parse_date(data_encerramento_inicio_str)
    data_encerramento_fim = parse_date(data_encerramento_fim_str)
    if data_encerramento_inicio:
        query = query.filter(cast(Evento.data_encerramento, Date) >= data_encerramento_inicio)
    if data_encerramento_fim:
        query = query.filter(cast(Evento.data_encerramento, Date) <= data_encerramento_fim)

    return query
