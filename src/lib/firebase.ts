// このファイルは Cursor により生成された
// Firebase 初期化（Auth/Firestore のstubs）

// 実際の Firebase SDK v9 の初期化はここに実装予定。
// まずはスタブをエクスポートし、アプリからはこの呼び口を利用する。

export type FirebaseAppStub = {
  auth: {
    currentUser: { uid: string; displayName: string; email: string } | null;
  };
  firestore: Record<string, unknown>;
};

let app: FirebaseAppStub = {
  auth: { currentUser: null },
  firestore: {},
};

export function getFirebaseApp(): FirebaseAppStub {
  return app;
}

export function setMockCurrentUser(user: { uid: string; displayName: string; email: string } | null) {
  app.auth.currentUser = user;
}


