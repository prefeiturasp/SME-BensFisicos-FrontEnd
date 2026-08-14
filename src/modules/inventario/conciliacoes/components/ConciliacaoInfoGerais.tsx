import { CampoReadonly } from './CampoReadonly';
import { ConciliacaoStatusBadge } from './ConciliacaoStatusBadge';
import { SECTION_TITLE_CLASS } from '../utils/form-styles';
import type { Conciliacao } from '../types/conciliacoes.types';

interface ConciliacaoInfoGeraisProps {
  conciliacao: Conciliacao;
  numeroConciliacaoDescricao?: string;
}

const NUMERO_CONCILIACAO_DESCRIPTION =
  'Formato: 001.XXXX/AAAA/VVV (eventual)';

function formatPeriodoFinal(periodoFinal: string) {
  if (!periodoFinal) {
    return '';
  }

  const [year, month, day] = periodoFinal.split('-');
  if (!year || !month || !day) {
    return periodoFinal;
  }

  return `${day}/${month}/${year}`;
}

function buildUnidadeAdministrativaLabel(conciliacao: Conciliacao) {
  if (conciliacao.unidade_administrativa_sigla) {
    return `${conciliacao.unidade_administrativa_codigo} - ${conciliacao.unidade_administrativa_sigla}`;
  }

  if (conciliacao.unidade_administrativa_nome) {
    return `${conciliacao.unidade_administrativa_codigo} - ${conciliacao.unidade_administrativa_nome}`;
  }

  return conciliacao.unidade_administrativa_codigo;
}

export function ConciliacaoInfoGerais({
  conciliacao,
  numeroConciliacaoDescricao = NUMERO_CONCILIACAO_DESCRIPTION,
}: Readonly<ConciliacaoInfoGeraisProps>) {
  return (
    <section
      className='space-y-5 p-4'
      data-testid='conciliacao-info-gerais'
      aria-label='Informações gerais da conciliação'
    >
      <h2 className={SECTION_TITLE_CLASS}>Informações gerais</h2>

      <div className='grid grid-cols-1 items-start gap-x-8 gap-y-5 lg:grid-cols-3'>
        <div className='space-y-1'>
          <CampoReadonly
            id='conciliacao-info-numero'
            label='Número da Conciliação'
            value={conciliacao.numero_conciliacao}
          />
          <p className='text-xs text-gray-500'>{numeroConciliacaoDescricao}</p>
        </div>

        <CampoReadonly
          id='conciliacao-info-unidade-administrativa'
          label='Unidade Administrativa'
          value={buildUnidadeAdministrativaLabel(conciliacao)}
        />

        <CampoReadonly
          id='conciliacao-info-tipo'
          label='Tipo'
          value={conciliacao.tipo_display}
        />
      </div>

      <div className='grid grid-cols-1 items-start gap-x-8 gap-y-5 lg:grid-cols-2'>
        <CampoReadonly
          id='conciliacao-info-periodo-final'
          label='Data Final do Período'
          value={formatPeriodoFinal(conciliacao.periodo_final)}
        />

        <div className='space-y-1'>
          <div className='flex h-6 items-center'>
            <label
              htmlFor='conciliacao-info-status'
              className='text-sm font-semibold text-gray-700'
            >
              Status
            </label>
          </div>
          <div
            id='conciliacao-info-status'
            className='flex h-11 items-center rounded-xs border border-gray-300 bg-[#F5F5F5] px-4'
            data-testid='conciliacao-info-status-wrapper'
          >
            <ConciliacaoStatusBadge status={conciliacao.status} />
          </div>
        </div>
      </div>
    </section>
  );
}
