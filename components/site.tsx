import Link from "next/link";
import Image from "next/image";
import { categories, type Template } from "@/lib/validation";
import { isDemo } from "@/lib/env";
import { IdeaCard } from "@/components/idea-card";
import { HeaderNavigation } from "@/components/header-navigation";
import { T } from "@/components/i18n";
import { HeaderSurface } from "@/components/header-surface";
import { ResponsiveView } from "@/components/responsive-view";
import { MobileHeader, MobileFooter } from "@/components/preserved-mobile-site";
export function Header() {
  return <ResponsiveView mobile={<MobileHeader />} desktop={<header className="site-header unified-header">
    <HeaderSurface />
    <Link href="/" className="wordmark" aria-label="MOTION ホーム"><Image className="header-logo" src="/motion/brand/motion-minimal-transparent.png" alt="MOTION" width={2400} height={619} loading="eager" unoptimized /></Link>
    <HeaderNavigation />
  </header>} />;
}
export function Footer() {
  const demo = isDemo();
  return <ResponsiveView mobile={<MobileFooter />} desktop={<footer className="site-footer unified-footer">
    <div className="footer-brand"><Link className="wordmark" href="/">MOTION</Link>
      <p><T k="footerTagline" /></p>
      <p className="micro"><T k={demo ? "earlyPreparing" : "earlyAccess"} />{demo && <><br /><T k="unavailable" /></>}</p>
    </div>
    <nav className="footer-directory" aria-label="フッターメニュー">
      <div><span><T k="explore" /></span><Link href="/templates"><T k="allIdeas" /></Link><Link href="/favorites"><T k="favorites" /></Link><Link href="/#how"><T k="how" /></Link><Link href="/#waitlist"><T k={demo ? "earlyPreparing" : "earlyAccess"} /></Link></div>
      <div><span><T k="explore" /></span>{(Object.keys(categories) as Array<keyof typeof categories>).map(key => <Link key={key} href={"/templates?category=" + key}><T k={key} /></Link>)}</div>
      <div><span><T k="information" /></span><Link href="/terms"><T k="terms" /></Link><Link href="/privacy"><T k="privacy" /></Link><Link href="/privacy#contact"><T k="contact" /></Link></div>
    </nav>
    <p className="footer-copyright micro">© MOTION</p>
  </footer>} />;
}
export function TemplateCard({ template, index = 0 }: {template: Template; index?: number}) {
  return <IdeaCard template={template} index={index} />;
}
export function EmptyTemplates() {
  return <div className="empty-state"><h2><T k="noResults" /></h2>
    <Link className="button secondary" href="/templates"><T k="explore" /></Link>
  </div>;
}
export function SetupNotice({message}: {message: string}) {
  return <main className="container narrow section"><span className="eyebrow">サイトの設定が必要です</span><h1>公開の準備をしています。</h1><p className="notice">{message}</p><p>運営者はREADMEの設定手順を確認してください。設定値そのものは画面に表示していません。</p></main>;
}
