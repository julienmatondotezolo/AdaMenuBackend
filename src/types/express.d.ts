declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: string | null;
      };
    }
  }
}

export {};
