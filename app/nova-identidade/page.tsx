import type { Metadata } from "next";
import { BrandBlueprintPage } from "@/components/brand/brand-blueprint-page";

export const metadata: Metadata = {
  title: "Nova Identidade | Pro Play Brasil",
  description: "Guia visual oficial da nova fase do frontend Pro Play Brasil."
};

export default function NovaIdentidadePage() {
  return <BrandBlueprintPage />;
}
