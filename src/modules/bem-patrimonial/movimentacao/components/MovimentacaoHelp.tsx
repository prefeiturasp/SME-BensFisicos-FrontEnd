import { CircleHelp } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const AJUDAS_MOVIMENTACAO = {
  faixa: 'Encontre bens da UA de origem pelo intervalo de números patrimoniais informado. Clique em Buscar para conferir os resultados e em Importar Faixa para adicioná-los aos selecionados.',
  de: 'Informe o número patrimonial completo do primeiro bem que deseja buscar, exatamente como aparece no cadastro.',
  ate: 'Informe o número patrimonial do último bem que deseja buscar. Se Até não for preenchido, a busca procurará exatamente o número informado em De.',
  regras: 'Podem ser adicionados bens da UA de origem com status Aprovado, sem bloqueio por inventário e sem outra movimentação pendente. Bens já selecionados não podem ser adicionados novamente. Aparecer na busca não significa que o bem pode ser adicionado.',
  importar: 'Adiciona os bens da faixa aos selecionados. Se algum número não existir na UA, algum bem estiver impedido ou já estiver selecionado, nenhum bem dessa faixa será adicionado. Cada faixa pode ter até 500 bens.',
  sequencia: 'De 001.000000010-0 até 001.000000012-0 busca os bens 010-0, 011-0 e 012-0.\n\nDe 123.342323423-2 até 123.342323423-3 busca dois bens: um terminado em -2 e outro em -3.\n\nPara importar uma faixa em que os números antes do hífen sejam diferentes, os dígitos finais precisam ser iguais.',
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
