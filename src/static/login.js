document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                loginContainer.style.display = 'none';
                mainContainer.style.display = 'block';
                // Disparar um evento customizado para notificar que o login foi feito
                document.dispatchEvent(new Event('loginSuccess'));
            } else {
                const errorData = await response.json();
                loginError.textContent = errorData.message || 'Falha no login.';
            }
        } catch (error) {
            loginError.textContent = 'Erro ao conectar ao servidor.';
        }
    });
});
