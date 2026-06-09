import type { Metadata } from "next";
import ProfileContent from "./ProfileContent";

export const metadata: Metadata = {
  title: "Profil Saya - SportTime Semarang",
  description: "Kelola profil, informasi kontak, dan kata sandi akun SportTime Anda.",
};

export default function ProfilePage() {
  return <ProfileContent />;
}
