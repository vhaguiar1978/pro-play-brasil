import Link from "next/link";
import { PaymentReturnStatus } from "@/components/payment-return-status";

type Props = {
  searchParams: Promise<{
    status?: string;
    payment_id?: string;
    collection_id?: string;
  }>;
};

function readStatusLabel(status: string | undefined) {
  if (status === "success") return "Pagamento aprovado";
  if (status === "pending") return "Pagamento pendente";
  if (status === "failure") return "Pagamento nao concluido";
  return "Retorno de pagamento";
}

function readStatusMessage(status: string | undefined) {
  if (status === "success") {
    return "O checkout foi concluido. No proximo passo vamos ligar a confirmacao automatica no saldo PPC.";
  }
  if (status === "pending") {
    return "O pagamento ficou pendente. Assim que o gateway confirmar, o sistema pode creditar o saldo automaticamente.";
  }
  if (status === "failure") {
    return "O pagamento nao foi concluido. Voce pode tentar novamente quando quiser.";
  }
  return "Essa pagina recebe o retorno do gateway de pagamento.";
}

export default async function PagamentoRetornoPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status;
  const paymentId = params.payment_id;
  const collectionId = params.collection_id;

  return (
    <div className="page">
      <section className="page-hero">
        <span className={`badge ${status === "success" ? "official" : status === "failure" ? "community" : ""}`}>
          Pagamentos
        </span>
        <h1>{readStatusLabel(status)}</h1>
        <p className="muted">{readStatusMessage(status)}</p>
      </section>

      <PaymentReturnStatus status={status} paymentId={paymentId} collectionId={collectionId} />

      <div className="card soft">
        <div className="inline-actions">
          <Link href="/arena/moedas" className="btn btn-primary">
            Voltar para PPC
          </Link>
          <Link href="/campeonatos" className="btn btn-secondary">
            Ir para campeonatos
          </Link>
        </div>
      </div>
    </div>
  );
}
