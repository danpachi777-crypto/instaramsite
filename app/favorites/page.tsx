import { getPublicTemplates } from "@/lib/templates";
import { configIssue } from "@/lib/env";
import { FavoritesGallery, FavoritesHeading } from "@/components/favorites-gallery";
import { T } from "@/components/i18n";
import { ResponsiveView } from "@/components/responsive-view";
export const metadata = { title: "お気に入り", robots: { index: false, follow: false } };
export default async function Favorites() {
  if (configIssue()) return null;
  return <main className="container section favorites-page favorites-board"><ResponsiveView desktop={<FavoritesHeading />} mobile={<><h1><T k="favoriteHeading" /></h1><p className="section-intro"><T k="favoriteIntro" /></p></>} /><FavoritesGallery templates={await getPublicTemplates()} /></main>;
}
