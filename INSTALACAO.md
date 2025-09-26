# Gestor de Eventos SC - Instruções de Instalação

## Descrição do Sistema

O **Gestor de Eventos SC** é um sistema web completo para gerenciamento de eventos com interface profissional estilo Excel. O sistema oferece funcionalidades completas de CRUD (Criar, Ler, Atualizar, Deletar) com filtros avançados e interface responsiva.

### Características Principais

- **Interface Profissional**: Design moderno com paleta roxa, ícones FontAwesome e efeitos CSS
- **CRUD Completo**: Cadastrar, editar, visualizar e deletar eventos
- **Filtros Avançados**: Filtro por status e busca textual em tempo real
- **Persistência de Filtros**: Os filtros são salvos no navegador
- **Modal Responsivo**: Formulários em modal para melhor experiência
- **Notificações Toast**: Feedback visual para todas as operações
- **Banco de Dados**: Suporte para PostgreSQL (Supabase)

### Campos do Sistema

- **Data**: Data do evento (obrigatório)
- **Ordem**: Código de identificação do evento (obrigatório)
- **Status**: Pendente, Preventiva, Tratamento, Encerramento, Encerrado (obrigatório)
- **ARD**: Código ARD (opcional)
- **SP**: Código SP (opcional)
- **Caixa**: Número da caixa (opcional)
- **Solicitante**: Nome do solicitante (obrigatório)
- **TA**: Código TA (opcional)

## Tecnologias Utilizadas

### Backend
- **Python 3.11+**
- **Flask**: Framework web
- **SQLAlchemy**: ORM para banco de dados
- **Flask-CORS**: Suporte a CORS
- **psycopg2-binary**: Driver PostgreSQL

### Frontend
- **HTML5**: Estrutura da página
- **CSS3**: Estilização com gradientes e animações
- **JavaScript ES6+**: Funcionalidades interativas
- **FontAwesome**: Ícones
- **Google Fonts**: Tipografia (Inter)

### Banco de Dados
- **PostgreSQL**: Para produção (Supabase)

## Pré-requisitos

- Python 3.11 ou superior
- pip (gerenciador de pacotes Python)
- Git (opcional, para clonar o repositório)

## Instalação Local

### 1. Preparar o Ambiente

```bash
# Criar diretório do projeto
mkdir gestor-eventos
cd gestor-eventos

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# No Windows:
venv\Scripts\activate
# No Linux/Mac:
source venv/bin/activate
```

### 2. Instalar Dependências

```bash
# Instalar dependências do requirements.txt
pip install -r requirements.txt
```

### 3. Configurar Banco de Dados

A aplicação está configurada para usar um banco de dados PostgreSQL no Supabase. As credenciais de conexão estão no arquivo `src/main.py`.

Para usar o seu próprio banco de dados Supabase:

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Obtenha as credenciais de conexão
4. Atualize as credenciais no arquivo `src/main.py`:

```python
# Substitua pela sua senha do Supabase
senha = quote_plus("SUA_SENHA_AQUI")
DATABASE_URL = f"postgresql://postgres:{senha}@SEU_HOST.supabase.co:5432/postgres"
```

### 4. Executar a Aplicação

```bash
# Navegar para o diretório do projeto
cd gestor-eventos

# Ativar ambiente virtual (se não estiver ativo)
source venv/bin/activate

# Executar a aplicação
python src/main.py
```

A aplicação estará disponível em: `http://localhost:5000`

## Estrutura do Projeto

```
gestor-eventos/
├── src/
│   ├── models/
│   │   └── evento.py          # Modelo de dados
│   ├── routes/
│   │   └── evento.py          # Rotas da API
│   ├── static/
│   │   ├── index.html         # Interface principal
│   │   ├── styles.css         # Estilos CSS
│   │   └── script.js          # JavaScript
│   └── main.py               # Arquivo principal
├── venv/                     # Ambiente virtual
├── requirements.txt          # Dependências Python
└── INSTALACAO.md            # Este arquivo
```

## Configuração do Banco de Dados

### Criação Automática da Tabela

O sistema cria automaticamente as tabelas no banco de dados na primeira execução.

### Configuração do Supabase

Para usar o Supabase em produção:

1. **Criar Projeto no Supabase**:
   - Acesse [supabase.com](https://supabase.com)
   - Crie uma nova conta ou faça login
   - Clique em "New Project"
   - Escolha uma organização e defina nome/senha

2. **Obter Credenciais**:
   - Vá para Settings > Database
   - Copie a Connection String
   - Anote a senha definida

3. **Configurar Aplicação**:
   - Edite `src/main.py`
   - Substitua as credenciais na variável `DATABASE_URL`

## API Endpoints

O sistema expõe os seguintes endpoints REST:

### Eventos

- `GET /api/eventos` - Listar todos os eventos
  - Query params: `status`, `search`
- `POST /api/eventos` - Criar novo evento
- `GET /api/eventos/{id}` - Obter evento específico
- `PUT /api/eventos/{id}` - Atualizar evento
- `DELETE /api/eventos/{id}` - Deletar evento

### Exemplo de Payload

```json
{
    "data": "2025-08-17",
    "ordem": "EVT-001",
    "status": "Pendente",
    "ard": "ARD-123",
    "sp": "SP-456",
    "caixa": "CX-789",
    "solicitante": "João Silva",
    "ta": "TA-101"
}
```

## Funcionalidades da Interface

### 1. Listagem de Eventos
- Tabela responsiva com todos os eventos
- Badges coloridos para status
- Ações de editar e excluir por linha

### 2. Filtros
- **Filtro por Status**: Dropdown com todos os status disponíveis
- **Busca Textual**: Campo de busca que procura em todos os campos
- **Persistência**: Filtros são salvos no localStorage

### 3. Modal de Cadastro/Edição
- Formulário responsivo com validação
- Campos obrigatórios marcados com asterisco
- Feedback visual para erros e sucessos

### 4. Notificações
- Toast notifications para todas as operações
- Diferentes tipos: sucesso, erro, aviso
- Auto-dismiss após 5 segundos

## Solução de Problemas

### Erro de Conexão com Banco
```
could not translate host name to address
```
**Solução**: Verifique se as credenciais do Supabase estão corretas e se o seu ambiente tem acesso à internet.

### Erro de Dependências
```
ModuleNotFoundError: No module named 'flask'
```
**Solução**: Ative o ambiente virtual e instale as dependências:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Erro de CORS
```
Access to fetch blocked by CORS policy
```
**Solução**: O Flask-CORS já está configurado. Verifique se está importado corretamente.

### Porta em Uso
```
Address already in use
```
**Solução**: Altere a porta no arquivo `main.py` ou mate o processo:
```bash
# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## Personalização

### Alterar Cores
Edite as variáveis CSS em `src/static/styles.css`:

```css
:root {
    --primary-color: #6B46C1;    /* Cor principal */
    --secondary-color: #A855F7;   /* Cor secundária */
    --accent-color: #C084FC;      /* Cor de destaque */
}
```

### Adicionar Campos
1. Atualize o modelo em `src/models/evento.py`
2. Adicione campos no formulário em `src/static/index.html`
3. Atualize as rotas em `src/routes/evento.py`
4. Modifique o JavaScript em `src/static/script.js`

### Alterar Status
Edite as opções de status em:
- `src/static/index.html` (formulário)
- `src/static/script.js` (ícones e cores)
- `src/static/styles.css` (estilos dos badges)

## Segurança

### Recomendações para Produção

1. **Alterar SECRET_KEY**:
```python
app.config['SECRET_KEY'] = 'sua-chave-secreta-forte-aqui'
```

2. **Usar HTTPS**: Configure SSL/TLS no servidor

3. **Validação de Entrada**: Implementar validação mais rigorosa

4. **Rate Limiting**: Adicionar limitação de requisições

5. **Autenticação**: Implementar sistema de login se necessário

## Suporte

Para dúvidas ou problemas:

1. Verifique este arquivo de documentação
2. Consulte os logs da aplicação
3. Verifique as configurações de rede/firewall

## Licença

Este projeto foi desenvolvido para uso interno. Todos os direitos reservados.
