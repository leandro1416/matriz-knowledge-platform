import { createHash } from 'crypto';

export const sha256 = (data) =>
    createHash('sha256').update(data).digest('hex'); 