import Link from "next/link";
import { Cloud } from "@/components/sky";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <Cloud width={200} face className="mx-auto animate-float" />
      <h1 className="mt-6 text-5xl font-bold">Hov! 🙈</h1>
      <p className="mt-3 text-lg">Den side er drevet væk med skyerne.</p>
      <Link href="/" className="btn btn-sun mt-8">
        Tilbage til solskinnet ☀️
      </Link>
    </div>
  );
}
