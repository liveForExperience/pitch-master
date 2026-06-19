export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export type EditorLeaseConflictData = {
  holderDeviceId: string | null;
  expiresAt: number | null;
};

export class EditorLeaseError extends Error {
  readonly data: EditorLeaseConflictData;

  constructor(message: string, data: EditorLeaseConflictData) {
    super(message);
    this.name = 'EditorLeaseError';
    this.data = data;
  }
}
