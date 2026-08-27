import { supabase } from './supabaseClient';

export function initAuth() {
    const authModalBtn = document.getElementById('authModalBtn');
    const userInfo = document.getElementById('userInfo');
    const userEmailSpan = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const authBackdrop = document.getElementById('authBackdrop');
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    const authForm = document.getElementById('authForm');
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authToggleText = document.getElementById('authToggleText');
    const authToggleLink = document.getElementById('authToggleLink');

    let isSignUp = false;

    // Проверка текущей сессии при загрузке
    checkUser();

    async function checkUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            if (authModalBtn) authModalBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (userEmailSpan) userEmailSpan.textContent = user.email;
        } else {
            if (authModalBtn) authModalBtn.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    // Открытие/закрытие модалки
    if (authModalBtn) authModalBtn.addEventListener('click', () => authBackdrop.style.display = 'flex');
    if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => authBackdrop.style.display = 'none');
    if (authBackdrop) {
        authBackdrop.addEventListener('click', (e) => {
            if (e.target === authBackdrop) authBackdrop.style.display = 'none';
        });
    }

    // Переключение между Login и Sign Up
    if (authToggleLink) {
        authToggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            isSignUp = !isSignUp;
            if (isSignUp) {
                authTitle.textContent = 'Create Account';
                authSubmitBtn.textContent = 'Sign Up';
                authToggleText.textContent = 'Already have an account?';
                authToggleLink.textContent = 'Sign In';
            } else {
                authTitle.textContent = 'Sign In';
                authSubmitBtn.textContent = 'Sign In';
                authToggleText.textContent = "Don't have an account?";
                authToggleLink.textContent = 'Sign Up';
            }
        });
    }

    // Обработка отправки формы
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) {
                    alert('Registration error: ' + error.message);
                } else {
                    alert('Registration successful! Check your email to confirm registration or sign in.');
                    authBackdrop.style.display = 'none';
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    alert('Login error: ' + error.message);
                } else {
                    authBackdrop.style.display = 'none';
                    checkUser();
                    // Сообщаем приложению, что пользователь вошел
                    window.dispatchEvent(new CustomEvent('userStateChanged'));
                }
            }
        });
    }

    // Выход
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            checkUser();
            window.dispatchEvent(new CustomEvent('userStateChanged'));
        });
    }
}