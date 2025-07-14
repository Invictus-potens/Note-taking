import admin from "firebase-admin";
import serviceAccount from "./notes-taking-a9eca-firebase-adminsdk-fbsvc-ad2676c126.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export { admin }; 