// Táº¡o ra setting page cho phÃ©p 
// 1. Thay Ä‘á»•i tÃªn
// 2. Thay Ä‘á»•i pass
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { User, Save, CheckCircle, Lock, TriangleAlert } from "lucide-react";
import Loading from "@/components/Loading";
import api from "@/lib/axios";
import { API_PATHS } from "@/lib/apiPaths";

export default function SettingsPage() {
    const { data: session, status, update } = useSession();

    const [mounted, setMounted] = useState(false);

    const [name, setName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");

    useEffect(() => {
        setMounted(true);
        if (session?.user?.name) {
            setName(session.user.name);
        }
    }, [session]);

    if (status === "loading" || !mounted) {
        return <Loading />;
    }

    if (status === "unauthenticated" || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 border-t border-slate-200">
                <div className="p-8 text-black font-bold bg-white rounded-lg">
                    Please log in to view settings.
                </div>
            </div>
        );
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage("");

        try {
            const res = await api.put(API_PATHS.USER_SETTINGS, { name });

            if (res.status === 200) {
                setMessage("Profile updated successfully!");
                await update({ name });
            } else {
                setMessage(`Error: ${res.data.error || "Failed to update profile"}`);
            }
        } catch (err: unknown) {
            console.error(err);
            const error = err as { response?: { data?: { error?: string } } };
            setMessage(`Error: ${error.response?.data?.error || "Network error. Could not update profile."}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setPasswordMessage("Error: New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage("Error: New password must be at least 6 characters");
            return;
        }

        setIsPasswordSaving(true);
        setPasswordMessage("");

        try {
            const res = await api.put(API_PATHS.USER_PASSWORD, { currentPassword, newPassword, confirmPassword });

            if (res.status === 200) {
                setPasswordMessage("Password updated successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setPasswordMessage(`Error: ${res.data.error || "Failed to update password"}`);
            }
        } catch (err: unknown) {
            console.error(err);
            const error = err as { response?: { data?: { error?: string } } };
            setPasswordMessage(`Error: ${error.response?.data?.error || "Network error. Could not update password."}`);
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const handleDeleteAccount = () => {
        const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
        if (confirmed) {
            console.log("Delete account triggered");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 pb-24 duration-200">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-200 bg-white flex items-center gap-2 text-slate-800 font-bold">
                        <User className="w-5 h-5 text-blue-600" />
                        Profile Details
                    </div>

                    <form className="p-6 space-y-5" onSubmit={handleUpdateProfile}>
                        {message && (
                            <div
                                className={`p-4 rounded-lg font-medium text-sm flex items-center gap-2 ${message.includes("success")
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                    }`}
                            >
                                {message.includes("success") && <CheckCircle className="w-5 h-5" />}
                                {message}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="What should we call you?"
                                className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                disabled
                                value={session.user.email!}
                                className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div className="pt-4 flex justify-start">
                            <button
                                type="submit"
                                disabled={isSaving || name === session.user.name}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium"
                            >
                                <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Profile"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-200 bg-white flex items-center gap-2 text-slate-800 font-bold">
                        <Lock className="w-5 h-5 text-indigo-600" />
                        Security
                    </div>

                    <form className="p-6 space-y-5" onSubmit={handleUpdatePassword}>
                        {passwordMessage && (
                            <div
                                className={`p-4 rounded-lg font-medium text-sm flex items-center gap-2 ${passwordMessage.includes("success")
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                    }`}
                            >
                                {passwordMessage.includes("success") && <CheckCircle className="w-5 h-5" />}
                                {passwordMessage}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Current Password
                            </label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                            />
                        </div>

                        <div className="pt-4 flex justify-start">
                            <button
                                type="submit"
                                disabled={isPasswordSaving || !currentPassword || !newPassword || !confirmPassword}
                                className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium"
                            >
                                <Lock className="w-4 h-4" /> {isPasswordSaving ? "Updating..." : "Change Password"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                    <div className="p-5 border-b border-red-100 bg-red-50 flex items-center gap-2 text-red-700 font-bold">
                        <TriangleAlert className="w-5 h-5" />
                        Danger Zone
                    </div>

                    <div className="p-6 flex flex-col gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Delete Account</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Permanently remove your account and all associated access. This action cannot be undone.
                            </p>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
