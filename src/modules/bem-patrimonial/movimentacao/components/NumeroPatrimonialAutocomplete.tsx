import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MovimentacaoHelp } from './MovimentacaoHelp';
import { movimentacaoService } from '../services/movimentacao.service';
import type { MovimentacaoBem } from '../types/movimentacao.types';
import { formatarNP } from '../utils/numero-patrimonial';

type NumeroPatrimonialAutocompleteProps = Readonly<{
  id: string;
  label: string;
  ajuda: string;
  value: string;
  unidadeAdministrativaId: number | null;
  disabled?: boolean;
  onChange: (value: string) => void;
}>;

type AutocompleteContentProps = Readonly<{
  carregando: boolean;
  resultados: MovimentacaoBem[];
  onSelect: (bem: MovimentacaoBem) => void;
}>;

function AutocompleteContent({ carregando, resultados, onSelect }: AutocompleteContentProps) {
  if (carregando) {
    return <li className='px-3 py-2 text-sm text-gray-500'>Buscando...</li>;
  }
  if (resultados.length === 0) {
    return <li className='px-3 py-2 text-sm text-gray-500'>Nenhum bem aprovado encontrado.</li>;
  }
  return (
    <>
      {resultados.map((bem) => (
        <li key={bem.id} className='border-b border-gray-100 last:border-0'>
          <button
            type='button'
            className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-[#00703C] hover:text-white'
            onClick={() => onSelect(bem)}
          >
            {bem.numero_patrimonial} - {bem.nome}
          </button>
        </li>
      ))}
    </>
  );
}

export function NumeroPatrimonialAutocomplete({
  id,
  label,
  ajuda,
  value,
  unidadeAdministrativaId,
  onChange,
  disabled = false,
}: NumeroPatrimonialAutocompleteProps) {
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [resultados, setResultados] = useState<MovimentacaoBem[]>([]);
  const versao = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buscaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      versao.current += 1;
      if (buscaRef.current) clearTimeout(buscaRef.current);
    };
  }, []);

  useEffect(() => {
    versao.current += 1;
    if (buscaRef.current) clearTimeout(buscaRef.current);
    setAberto(false);
    setResultados([]);
  }, [unidadeAdministrativaId]);

  const buscarOpcoes = useCallback(
    async (termo: string) => {
      if (!unidadeAdministrativaId) return;
      const pedido = ++versao.current;
      setCarregando(true);
      try {
        const resposta = await movimentacaoService.listBensMovimentaveis(
          unidadeAdministrativaId,
          termo,
        );
        if (pedido !== versao.current) return;
        setResultados(resposta.filter((bem) => Boolean(bem.numero_patrimonial)));
      } catch {
        if (pedido === versao.current) setResultados([]);
      } finally {
        if (pedido === versao.current) setCarregando(false);
      }
    },
    [unidadeAdministrativaId],
  );

  const handleChange = (novoValor: string) => {
    const valorFormatado = formatarNP(novoValor);
    versao.current += 1;
    setResultados([]);
    onChange(valorFormatado);
    setAberto(true);
    if (buscaRef.current) clearTimeout(buscaRef.current);
    buscaRef.current = setTimeout(() => void buscarOpcoes(valorFormatado), 300);
  };

  return (
    <div className='relative space-y-2' ref={containerRef}>
      <div className='flex items-center gap-1'>
        <label htmlFor={id} className='text-sm font-semibold text-gray-700'>
          {label}
        </label>
        <MovimentacaoHelp label={`Ajuda sobre ${label}`} text={ajuda} />
      </div>
      <Input
        id={id}
        disabled={disabled}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => {
          setAberto(true);
          void buscarOpcoes(value);
        }}
        placeholder='000.000000000-0'
        inputMode='numeric'
        maxLength={15}
        className='h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white'
        aria-autocomplete='list'
        aria-expanded={aberto}
      />
      {aberto && unidadeAdministrativaId && !disabled ? (
        <ul className='absolute top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded border border-gray-300 bg-white shadow-lg'>
          <AutocompleteContent
            carregando={carregando}
            resultados={resultados}
            onSelect={(bem) => {
              versao.current += 1;
              if (buscaRef.current) clearTimeout(buscaRef.current);
              onChange(bem.numero_patrimonial ?? '');
              setAberto(false);
            }}
          />
        </ul>
      ) : null}
    </div>
  );
}
