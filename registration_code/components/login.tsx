import { useAuth } from "../auth/auth";

export default function Login() {
  const { login, register } = useAuth();

  return (
    <div>
      <button onClick={login}>
        Log In
      </button>

      <button onClick={register}>
        Create Account
      </button>
    </div>
  );
}