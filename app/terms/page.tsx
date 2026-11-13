import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "利用規約",
  alternates: { canonical: "/terms" },
};
export default function Terms() {
  return (
    <main className="container narrow section legal">
      <span className="eyebrow">ご利用にあたって</span>
      <h1>利用規約</h1>
      <p className="notice">
        運営者確認用の下書きです。公開前に内容と運営者情報を確定してください。
      </p>
      <h2>現在のサービス</h2>
      <p>
        MOTIONはAI動画テンプレートの作例を紹介します。現在、動画生成、購入、決済、素材アップロード、一般利用者のアカウント機能は提供していません。
      </p>
      <h2>作例と素材</h2>
      <p>
        仮のイメージや「プレビュー準備中」の表示は、完成した生成動画ではありません。紹介するスタイルは制作のイメージを伝えるためのもので、同一の結果、再生数、拡散、収入を保証しません。素材の権利は各権利者に帰属します。無断転載・再配布はお控えください。
      </p>
      <h2>禁止事項</h2>
      <p>
        不正なアクセス、過剰な連続送信、運営や他の利用者の妨げになる行為は禁止します。
      </p>
      <h2>提供内容の変更</h2>
      <p>
        内容の変更や提供の中断・終了を行う場合があります。利用者の権利を不当に制限しないよう、運営者が適用されるルールを確認して対応します。
      </p>
      <h2>お問い合わせ</h2>
      <p>
        運営者情報とお問い合わせ先は
        <Link href="/privacy#contact">
          プライバシーポリシーの問い合わせ窓口
        </Link>
        をご確認ください。
      </p>
      <h2>公開前に運営者が確定する項目</h2>
      <p>
        運営者名・会社情報・実在する連絡先、規約の適用日、準拠法と紛争解決に関する条項を運営形態に合わせて確認・追記してください。
      </p>
      <p className="micro">
        この文章は運営者による確認が必要な下書きで、法令適合を保証するものではありません。
      </p>
    </main>
  );
}
