import { AuthProvider } from 'react-admin';
import { db } from '../services/api';

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      const users = await db.getUsers();
      
      // Если пользователей нет, создаем дефолтного админа (для первого запуска)
      if (users.length === 0) {
        if (username === 'testadmin' && password === 'testchtb') {
          const defaultAdmin = {
            id: '1',
            username: 'testadmin',
            password: 'testchtb', // В реальном приложении пароли нужно хешировать!
            fullName: 'Default Admin',
            role: 'admin' as const,
            isActive: true
          };
          await db.saveUser(defaultAdmin);
          localStorage.setItem('onr_admin_auth', JSON.stringify({ role: 'admin', username }));
          return Promise.resolve();
        }
      }

      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        if (!user.isActive) {
          return Promise.reject(new Error('Пользователь заблокирован'));
        }
        localStorage.setItem('onr_admin_auth', JSON.stringify({ role: user.role, username: user.username }));
        return Promise.resolve();
      }

      return Promise.reject(new Error('Неверный логин или пароль'));
    } catch (error) {
      console.error('Login error:', error);
      return Promise.reject(new Error('Ошибка авторизации'));
    }
  },
  
  logout: () => {
    localStorage.removeItem('onr_admin_auth');
    return Promise.resolve();
  },
  
  checkAuth: () => {
    return localStorage.getItem('onr_admin_auth')
      ? Promise.resolve()
      : Promise.reject();
  },
  
  checkError: (error) => {
    const status = error?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('onr_admin_auth');
      return Promise.reject();
    }
    return Promise.resolve();
  },
  
  getPermissions: () => {
    const auth = localStorage.getItem('onr_admin_auth');
    if (auth) {
      const { role } = JSON.parse(auth);
      return Promise.resolve(role);
    }
    return Promise.reject();
  }
};



