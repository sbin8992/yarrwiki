import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST() {
  (await cookies()).set("session", "", { expires: new Date(0) });
  redirect("/");
}
