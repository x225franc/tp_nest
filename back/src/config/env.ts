import 'dotenv/config';

export const getRequiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Variable introuvable: ${key}`);
    }
    return value;
};

export const getRequiredNumberEnv = (key: string): number => {
    const value = Number(getRequiredEnv(key));
    if (Number.isNaN(value)) {
        throw new Error(`Variable invalide: ${key}`);
    }
    return value;
};
