import { AuthProvider } from 'react-admin';

export const authProvider: AuthProvider = {
  login: ({ username, password }) => {
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('onr_admin_auth', 'true');
      return Promise.resolve();
    }
    return Promise.reject(new Error('Неверный логин или пароль'));
  },
  
  logout: () => {
    localStorage.removeItem('onr_admin_auth');
    return Promise.resolve();
  },
  
  checkAuth: () => {
    return localStorage.getItem('onr_admin_auth') === 'true'
      ? Promise.resolve()
      : Promise.reject();
  },
  
  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('onr_admin_auth');
      return Promise.reject();
    }
    return Promise.resolve();
  },
  
  getPermissions: () => {
    return Promise.resolve();
  }
};

