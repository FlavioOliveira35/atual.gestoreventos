from flask import request
from sqlalchemy import cast, Date, func
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

def get_filtered_query(current_user, apply_status_filter=True):
    """
    Constrói e retorna uma query SQLAlchemy para Eventos com base nos filtros da request.
    O parâmetro `apply_status_filter` controla se o filtro de status deve ser aplicado.
    """
    status_filter = request.args.get('status') if apply_status_filter else None
    search_filter = request.args.get('search')
    data_inicio_str = request.args.get('data_inicio')
    data_fim_str = request.args.get('data_fim')
    data_encerramento_inicio_str = request.args.get('data_encerramento_inicio')
    data_encerramento_fim_str = request.args.get('data_encerramento_fim')
    states_filter_str = request.args.get('states')

    query = Evento.query.options(
        joinedload(Evento.city),
        joinedload(Evento.ard),
        joinedload(Evento.solicitante),
        joinedload(Evento.equipe)
    )

    # Lógica de filtro por estado (plantão) ou por cidade (padrão)
    if states_filter_str:
        state_list = [s.strip().upper() for s in states_filter_str.split(',') if s.strip()]
        if state_list:
            query = query.join(Evento.city).filter(City.state.in_(state_list))
    else:
        user_city_ids = [city.id for city in current_user.cities]
        if user_city_ids:
            query = query.filter(Evento.city_id.in_(user_city_ids))

    # Lógica de filtro de status e data de encerramento
    statuses = []
    if status_filter:
        statuses = [s.strip() for s in status_filter.split(',') if s.strip()]

    data_encerramento_inicio = parse_date(data_encerramento_inicio_str)
    data_encerramento_fim = parse_date(data_encerramento_fim_str)

    apply_special_encerrado_filter = ('Encerrado' in statuses and
                                      not data_encerramento_inicio_str and
                                      not data_encerramento_fim_str)

    if statuses:
        if apply_special_encerrado_filter:
            other_statuses = [s for s in statuses if s != 'Encerrado']

            conditions = []
            if other_statuses:
                conditions.append(Evento.status.in_(other_statuses))

            # Compara a data de encerramento com a data atual no fuso horário de Brasília
            # 1. Trata a data de encerramento (assumida como UTC) e a converte para o fuso 'America/Sao_Paulo'
            # 2. Trata a data atual do servidor e a converte para o fuso 'America/Sao_Paulo'
            # 3. Compara se as datas resultantes (dia/mês/ano) são iguais.
            conditions.append(
                db.and_(
                    Evento.status == 'Encerrado',
                    cast(Evento.data_encerramento.op('at time zone')('utc').op('at time zone')('America/Sao_Paulo'), Date) == cast(func.now().op('at time zone')('America/Sao_Paulo'), Date)
                )
            )
            query = query.filter(db.or_(*conditions))
        else:
            # Filtro de status padrão
            query = query.filter(Evento.status.in_(statuses))

    # Aplica o filtro de data de encerramento avançado apenas se a lógica especial não foi usada
    if not apply_special_encerrado_filter:
        if data_encerramento_inicio:
            query = query.filter(cast(Evento.data_encerramento, Date) >= data_encerramento_inicio)
        if data_encerramento_fim:
            query = query.filter(cast(Evento.data_encerramento, Date) <= data_encerramento_fim)

    # Filtros restantes (busca e data de abertura)
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

    return query
