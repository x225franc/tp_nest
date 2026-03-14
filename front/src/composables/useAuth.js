import { ref } from "vue";
import router from "../router";

const isLoggedIn = ref(false);
const currentUser = ref(null);

const storedUser = localStorage.getItem("currentUser");
if (storedUser) {
	try {
		isLoggedIn.value = true;
		currentUser.value = JSON.parse(storedUser);
	} catch (err) {
		console.error("Erreur du localStorage", err);
		localStorage.removeItem("currentUser");
	}
}

export function useAuth() {
	const signin = async (email, password) => {
		try {
			const response = await fetch(`${window.config.BACKEND_URL}/auth/signin`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Erreur de connexion");
			}

			const data = await response.json();
			const userData = {
				id: data.id,
				username: data.username,
				email: data.email,
				customColor: data.customColor,
				token: data.token,
			};
			localStorage.setItem("currentUser", JSON.stringify(userData));
			isLoggedIn.value = true;
			currentUser.value = userData;
			return { success: true, user: currentUser.value };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const signup = async (username, email, password) => {
		try {
			const response = await fetch(`${window.config.BACKEND_URL}/auth/signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, email, password }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Erreur d'inscription");
			}

			return {
				success: true,
				message: "Compte créé.",
			};
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const logout = () => {
		localStorage.removeItem("currentUser");
		isLoggedIn.value = false;
		currentUser.value = null;
		router.push({ name: "Home" });
	};

	const updateProfile = async (profileData) => {
		try {
			const user = localStorage.getItem("currentUser");
			if (!user) {
				throw new Error("Non authentifié");
			}

			const userData = JSON.parse(user);
			const token = userData.token;

			const response = await fetch(
				`${window.config.BACKEND_URL}/auth/profile`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(profileData),
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					error.message || "Erreur maj profil",
				);
			}

			const data = await response.json();
			const updatedUserData = {
				...userData,
				username: data.username,
				customColor: data.customColor,
			};
			localStorage.setItem("currentUser", JSON.stringify(updatedUserData));
			currentUser.value = updatedUserData;
			return { success: true, message: "Profil modifié" };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	return {
		isLoggedIn,
		currentUser,
		signin,
		signup,
		logout,
		updateProfile,
	};
}
