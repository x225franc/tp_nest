import { ref } from "vue";
import router from "../router";

const isLoggedIn = ref(false);
const currentUser = ref(null);
const token = ref(null);

const storedUser = localStorage.getItem("currentUser");
if (storedUser) {
	try {
		const parsedUser = JSON.parse(storedUser);
		isLoggedIn.value = true;
		currentUser.value = parsedUser;
		token.value = parsedUser.token;
	} catch (err) {
		console.error("Erreur du localStorage", err);
		localStorage.removeItem("currentUser");
	}
}

const apiFetch = async (endpoint, options = {}) => {
	const defaultHeaders = { "Content-Type": "application/json" };

	if (options.requireAuth && token.value) {
		defaultHeaders.Authorization = `Bearer ${token.value}`;
	}

	const response = await fetch(`${window.config.BACKEND_URL}${endpoint}`, {
		method: options.method || "POST",
		headers: { ...defaultHeaders, ...options.headers },
		body: options.body ? JSON.stringify(options.body) : undefined,
	});

	const data = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(data.message || "Une erreur est survenue");
	}

	return data;
};

const setUserState = (userData) => {
	localStorage.setItem("currentUser", JSON.stringify(userData));
	isLoggedIn.value = true;
	currentUser.value = userData;
	token.value = userData.token;
};

export function useAuth() {
	const signin = async (email, password) => {
		try {
			const data = await apiFetch("/auth/signin", {
				body: { email, password },
			});
			
			if (data.status === "2FA_REQUIRED") {
				return {
					success: false,
					error: "2FA_REQUIRED",
					userId: data.userId,
					message: data.message,
				};
			}

			setUserState(data);
			return { success: true, user: currentUser.value };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const signup = async (username, email, password) => {
		try {
			await apiFetch("/auth/signup", { body: { username, email, password } });
			return {
				success: true,
				message: "Compte créé. Veuillez vérifier votre email.",
			};
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const verifyEmail = async (emailToken) => {
		try {
			await apiFetch("/auth/verify-email", { body: { token: emailToken } });
			return { success: true, message: "Email vérifié" };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const validateResetToken = async (resetToken) => {
		try {
			await apiFetch("/auth/validate-reset-token", {
				body: { token: resetToken },
			});
			return { success: true };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const forgotPassword = async (email) => {
		try {
			const data = await apiFetch("/auth/forgot-password", { body: { email } });
			return { success: true, message: data.message };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const resetPassword = async (resetToken, newPassword) => {
		try {
			const data = await apiFetch("/auth/reset-password", {
				body: { token: resetToken, newPassword },
			});
			return { success: true, message: data.message };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const updateProfile = async (profileData) => {
		try {
			if (!isLoggedIn.value) throw new Error("Non authentifié");

			const data = await apiFetch("/auth/profile", {
				method: "PUT",
				body: profileData,
				requireAuth: true,
			});

			setUserState({
				...currentUser.value,
				username: data.username,
				customColor: data.customColor,
			});
			return { success: true, message: "Profil modifié" };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const changePassword = async (oldPassword, newPassword) => {
		try {
			if (!isLoggedIn.value) throw new Error("Non authentifié");

			const data = await apiFetch("/auth/change-password", {
				body: { oldPassword, newPassword },
				requireAuth: true,
			});
			return { success: true, message: data.message };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const logout = () => {
		localStorage.removeItem("currentUser");
		isLoggedIn.value = false;
		currentUser.value = null;
		token.value = null;
		router.push("/");
	};

	const enable2FA = async () => {
		try {
			if (!isLoggedIn.value) throw new Error("Non authentifié");
			const data = await apiFetch("/auth/enable-2fa", {
				body: {},
				requireAuth: true,
			});
			return { success: true, message: data.message };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const disable2FA = async () => {
		try {
			if (!isLoggedIn.value) throw new Error("Non authentifié");
			const data = await apiFetch("/auth/disable-2fa", {
				body: {},
				requireAuth: true,
			});
			return { success: true, message: data.message };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	const verify2FALogin = async (code, userId) => {
		try {
			const data = await apiFetch("/auth/verify-2fa-login", {
				body: { code, userId },
			});
			const userResult = await apiFetch("/auth/signin-2fa-verified", {
				body: { userId },
			});
			setUserState(userResult);
			return { success: true, user: currentUser.value };
		} catch (err) {
			return { success: false, error: err.message };
		}
	};

	return {
		isLoggedIn,
		currentUser,
		token,
		signin,
		signup,
		verifyEmail,
		validateResetToken,
		forgotPassword,
		resetPassword,
		updateProfile,
		changePassword,
		logout,
		enable2FA,
		disable2FA,
		verify2FALogin,
	};
}
