import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Register() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // If user is already logged in, redirect to /home immediately
    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            try {
                const response = await api.get("/customers/me");
                if (isMounted && response.data && response.data._id) {
                    navigate("/home");
                }
            } catch (err) {
                // Not logged in, stay on register page
            }
        };

        checkAuth();
        return () => {
            isMounted = false;
        };
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!fullName || !email || !password || !phone) {
            setError("All fields are required");
            return;
        }

        if (password.length < 6) {
            setError("Password must contain at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await api.post("/customers/register", {
                fullName,
                email,
                password,
                phone
            });

            navigate("/login");
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError("Something went wrong");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="form-box">
                <h2>Create Account</h2>

                {error !== "" && <p className="error">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <label>Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        placeholder="Enter your full name"
                        onChange={(e) => setFullName(e.target.value)}
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        placeholder="Enter your email"
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        placeholder="Minimum 6 characters"
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <label>Phone Number</label>
                    <input
                        type="text"
                        value={phone}
                        placeholder="Enter your phone number"
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p>
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
