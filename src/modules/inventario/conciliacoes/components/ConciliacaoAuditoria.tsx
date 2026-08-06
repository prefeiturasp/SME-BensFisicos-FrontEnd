import { SECTION_TITLE_CLASS } from '../utils/form-styles';
import type { Conciliacao } from '../types/conciliacoes.types';

interface ConciliacaoAuditoriaProps {
  conciliacao: Conciliacao;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${DATE_FORMATTER.format(date)} às ${TIME_FORMATTER.format(date)}`;
}

function buildUsuarioLabel(nome: string | null | undefined, rf: string | null | undefined) {
  const nomeLimpo = nome?.trim();
  const rfLimpo = rf?.trim();

  if (nomeLimpo && rfLimpo) {
    return `${nomeLimpo} (RF ${rfLimpo})`;
  }

  if (nomeLimpo) {
    return nomeLimpo;
  }

  if (rfLimpo) {
    return `RF ${rfLimpo}`;
  }

  return '-';
}

function buildDateTimeLabel(value: string | null) {
  return formatDateTime(value) ?? '-';
}

export function ConciliacaoAuditoria({ conciliacao }: Readonly<ConciliacaoAuditoriaProps>) {
  const criadoPor = buildUsuarioLabel(conciliacao.criado_por_nome, conciliacao.criado_por_rf);
  const criadoEm = buildDateTimeLabel(conciliacao.criado_em);

  const isFechado =
    Boolean(conciliacao.fechado_em) ||
    (conciliacao.fechado_por !== null && conciliacao.fechado_por !== undefined);

  const fechadoPor = isFechado
    ? buildUsuarioLabel(conciliacao.fechado_por_nome, conciliacao.fechado_por_rf)
    : '-';
  const fechadoEm = buildDateTimeLabel(conciliacao.fechado_em);

  return (
    <section
      className='space-y-5 p-4'
      data-testid='conciliacao-auditoria'
      aria-label='Auditoria da conciliação'
    >
      <h2 className={SECTION_TITLE_CLASS}>Auditoria</h2>

      <div className='grid grid-cols-1 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4'>
        <div className='space-y-1' data-testid='conciliacao-auditoria-criado-por'>
          <p className='font-semibold text-gray-500'>Criado por</p>
          <p className='font-semibold text-gray-700'>{criadoPor}</p>
        </div>

        <div className='space-y-1' data-testid='conciliacao-auditoria-criado-em'>
          <p className='font-semibold text-gray-500'>Criado em</p>
          <p className='font-semibold text-gray-700'>{criadoEm}</p>
        </div>

        <div className='space-y-1' data-testid='conciliacao-auditoria-fechado-por'>
          <p className='font-semibold text-gray-500'>Fechado por</p>
          <p className='font-semibold text-gray-700'>{fechadoPor}</p>
        </div>

        <div className='space-y-1' data-testid='conciliacao-auditoria-fechado-em'>
          <p className='font-semibold text-gray-500'>Fechado em</p>
          <p className='font-semibold text-gray-700'>{fechadoEm}</p>
        </div>
      </div>
    </section>
  );
}
