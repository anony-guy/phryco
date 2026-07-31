// Manages the JWT token and user session

export function setToken(token) {
    localStorage.setItem('phryco_token', token);
}

export function getToken() {
    return localStorage.getItem('phryco_token');
}

export function clearToken() {
    localStorage.removeItem('phryco_token');
}

export function isAuthenticated() {
    return !!getToken();
}

export function getAuthHeaders() {
    const token = getToken();
    if (token) {
        return {
            'Authorization': `Bearer ${token}`
        };
    }
    return {};
}
