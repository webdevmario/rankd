import { ShareView } from "./share-view";

export default async function ShareListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ShareView id={id} />;
}
