import io
from flask import Blueprint, send_file
from src.models.evento import Evento
import pandas as pd
from src.auth import token_required
from src.routes.utils import get_filtered_query

export_bp = Blueprint('export', __name__)

@export_bp.route('/eventos/export', methods=['GET'])
@token_required
def export_eventos(current_user):
    try:
        query = get_filtered_query(current_user)
        eventos = query.order_by(Evento.data.desc()).all()

        # Preparar dados para o DataFrame
        data_for_df = []
        for evento in eventos:
            data_for_df.append({
                'Data': evento.data.strftime('%d/%m/%Y %H:%M') if evento.data else '',
                'OC': evento.oc,
                'Status': evento.status,
                'Cidade': evento.city.name if evento.city else '',
                'ARD': evento.ard.name if evento.ard else '',
                'SP': evento.sp,
                'Caixa': evento.caixa,
                'PON': evento.pon,
                'OSP Regional': evento.ospregional,
                'Solicitante': evento.solicitante.name if evento.solicitante else '',
                'TA': evento.ta,
                'Afetação': evento.afetacao,
                'Equipe': evento.equipe.name if evento.equipe else '',
                'Rede': evento.rede,
                'Data de Encerramento': evento.data_encerramento.strftime('%d/%m/%Y %H:%M') if evento.data_encerramento else '',
            })

        df = pd.DataFrame(data_for_df)

        # Criar arquivo Excel em memória
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Eventos')

        output.seek(0)

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='eventos_export.xlsx'
        )

    except Exception as e:
        return str(e), 500
