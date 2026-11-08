import { useAuth } from "../auth/auth";

export default function LogoutButton() {
  const { signOut } = useAuth();

  return (
    <button onClick={signOut}>
      Log Out
    </button>
  );
}