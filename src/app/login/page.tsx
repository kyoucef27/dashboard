import { Suspense } from "react";
import LoginPage from "./loginpage";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
