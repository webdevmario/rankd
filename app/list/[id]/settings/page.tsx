import type { Metadata } from "next";
import { ListSettings } from "./list-settings";

export const metadata: Metadata = { title: "List settings" };

export default async function ListSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListSettings id={id} />;
}
