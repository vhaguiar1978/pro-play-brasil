import Link from "next/link";
import { publicRoutes } from "@/lib/public-routes";

const currentYear = new Date().getFullYear();

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 md:px-6 md:py-16">
      <div className="space-y-3">
        <span className="inline-flex w-fit rounded-full border border-ppb-border bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ppb-primary">
          Licenca de uso
        </span>
        <h1 className="text-4xl font-black tracking-tight text-ppb-text md:text-5xl">
          Termos de Uso
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-ppb-muted">
          Estes termos regulam o acesso e uso da plataforma Pro Play Brasil, incluindo campeonatos,
          inscricoes, rankings, suporte e demais funcionalidades disponibilizadas no site.
        </p>
      </div>

      <section className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
        <div className="space-y-6 text-sm leading-7 text-ppb-muted">
          <p>
            Ao acessar ou utilizar a plataforma, voce concorda em respeitar as regras publicadas para
            cada campeonato, agir de boa-fe e fornecer informacoes verdadeiras durante cadastro,
            inscricao e contato com a equipe.
          </p>
          <p>
            Todo o conteudo visual, marca, textos, organizacao da plataforma e materiais relacionados a
            Pro Play Brasil permanecem protegidos por direitos autorais e demais direitos aplicaveis. O
            uso indevido, copia nao autorizada, redistribuicao comercial ou reproducao integral da
            plataforma sem permissao previa nao e permitido.
          </p>
          <p>
            A plataforma pode atualizar funcionalidades, regras operacionais, taxas, cronogramas e
            criterios de participacao a qualquer momento, sempre que necessario para manter seguranca,
            organizacao competitiva e conformidade operacional.
          </p>
          <p>
            Em caso de uso abusivo, fraude, tentativa de manipulacao de resultados, violacao de regras
            ou conduta prejudicial a comunidade, a conta ou inscricao do usuario podera ser suspensa,
            limitada ou encerrada.
          </p>
          <p>
            Para suporte operacional ou solicitacoes relacionadas ao uso da plataforma, entre em contato
            pela pagina de{" "}
            <Link href={publicRoutes.support} className="font-semibold text-ppb-primary hover:underline">
              suporte
            </Link>
            .
          </p>
        </div>
      </section>

      <p className="text-xs text-ppb-muted">
        Ultima atualizacao: {currentYear}. {"(c)"} {currentYear} Pro Play Brasil. Todos os direitos reservados.
      </p>
    </div>
  );
}
