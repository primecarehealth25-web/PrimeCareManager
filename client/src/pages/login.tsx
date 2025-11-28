import { useState } from "react";
import { apiRequest } from "../lib/queryClient";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    try {
      const res = await apiRequest("POST", "/auth/login", { username, password });
      localStorage.setItem("token", (await res.json()).token); // Save token to browser
      window.location.href = "/"; // Redirect to dashboard/home
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex flex-col max-w-sm mx-auto mt-20 gap-2">
      <h2 className="text-xl font-bold text-center">Clinic Login</h2>

      <input
        type="text"
        placeholder="Username"
        className="border p-2 rounded"
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 rounded"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={login}
        className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
      >
        Login
      </button>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
