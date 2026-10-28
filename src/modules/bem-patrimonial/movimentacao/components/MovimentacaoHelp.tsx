import { CircleHelp } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const AJUDAS_MOVIMENTACAO = {
  previa: 'Esta lista é uma prévia das alterações na faixa. Os bens novos serão incluídos, os mantidos continuarão na faixa e os indicados para remoção sairão dela. A seleção só será alterada ao clicar em "Aplicar faixa".',
  faixa: 'Informe De e Até e clique em Buscar. A sequência inteira será conferida na UA de origem: todos os números precisam existir e todos os bens devem estar aptos. Os resultados só aparecem quando a faixa é válida. Depois, clique em Importar Faixa para adicioná-la aos selecionados.',
  de: 'Informe o número patrimonial completo do primeiro bem que deseja buscar, exatamente como aparece no cadastro.',
  ate: 'Informe o número patrimonial do último bem que deseja buscar. Se Até não for preenchido, a busca procurará exatamente o número informado em De.',
  regras: 'Podem ser adicionados bens da UA de origem com status Aprovado, sem bloqueio por inventário e sem outra movimentação pendente. Bens já selecionados não podem ser adicionados novamente. Aparecer na busca não significa que o bem pode ser adicionado.',
  importar: 'Adiciona os bens da faixa aos selecionados. Se algum número não existir na UA, algum bem estiver impedido ou já estiver selecionado, nenhum bem dessa faixa será adicionado. Cada faixa pode ter até 500 bens.',
  sequencia: 'O dígito após o hífen não é considerado para calcular a sequência de números patrimoniais. Por exemplo, de 001.000000010-0 até 001.000000012-0, a busca inclui os bens 010, 011 e 012, independentemente do dígito final cadastrado em cada um.\n\nDepois de importar, os bens da faixa permanecem selecionados em conjunto. Para retirá-los, remova a faixa da lista de selecionados.',
} as const

export function MovimentacaoHelp({ label, text }: Readonly<{ label: string; text: string }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type='button' aria-label={label} className='shrink-0 text-[#2F7D57]'>
          <CircleHelp className='size-4' />
        </button>
      </TooltipTrigger>
      <TooltipContent sideOffset={8} className='max-w-sm whitespace-pre-line text-left'>
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
