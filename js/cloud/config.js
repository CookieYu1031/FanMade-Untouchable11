/* Firebase 專案設定（Web 應用程式的設定值本來就是公開的，真正的存取控制在 Firestore 安全規則 firestore.rules） */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBkh8g8Xn8UgmcfKu9wdYROLJvIBXrNkZA",
  authDomain: "untouchable11-efe27.firebaseapp.com",
  projectId: "untouchable11-efe27",
  storageBucket: "untouchable11-efe27.firebasestorage.app",
  messagingSenderId: "765567200573",
  appId: "1:765567200573:web:96f1c7cd20b9ee3e91a954",
};
// 以 CDN 載入 Firebase 的瀏覽器版 SDK（網站沒有打包工具）
export const SDK_BASE = 'https://www.gstatic.com/firebasejs/10.12.2/';
