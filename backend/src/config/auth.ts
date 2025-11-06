export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'cipriankey',
  expiry: '7d',
};

export const SUSPEND_DELETE_PASSWORD = process.env.SUSPENDDELETEUSER || 'cipriankey';
export const BASE_STORE_PATH = '/home/cipriankali/Desktop/KapryGest/backend/db/store';
export const BCRYPT_ROUNDS = Number(process.env.BCRYPT_HASH) || 10;