const admin = require('firebase-admin');

/**
 * Middleware Express — verifica o token Firebase no header Authorization.
 * Uso: router.get('/rota', verifyToken, handler)
 *
 * Após verificação bem-sucedida, adiciona req.user com { uid, email, name, ... }
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = { verifyToken };
