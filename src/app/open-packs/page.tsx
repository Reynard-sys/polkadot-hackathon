import { Suspense } from "react";
import OpenPacks from "@/features/open-packs";

export default function OpenPacksPage() {
  return (
    <Suspense fallback={null}>
      <OpenPacks />
    </Suspense>
  );
}
