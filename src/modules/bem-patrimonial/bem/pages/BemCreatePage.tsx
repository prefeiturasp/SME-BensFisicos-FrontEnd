import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Boxes} from 'lucide-react'
import { toast } from 'sonner'
import { bemService } from '../services/bem.service'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { LinhaBemRow } from '../components/LinhaBemRow'

type LinhaBem = {
  id: string
  numero_patrimonial: string
  numero_formato_antigo: boolean
  sem_numeracao: boolean
  localizacao: string
}

const INPUT_CLASS =
  'h-11 w-full border border-gray-300 rounded-xs px-4 text-sm text-gray-700'

export default function BemCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [formBase, setFormBase] = useState({
    unidade_administrativa: '',
    nome: '',
    descricao: '',
    valor_unitario: '',
    marca: '',
    modelo: '',
    numero_processo: '',
  })

  const [linhas, setLinhas] = useState<LinhaBem[]>([
    {
      id: crypto.randomUUID(),
      numero_patrimonial: '',
      numero_formato_antigo: false,
      sem_numeracao: false,
      localizacao: '',
    },
  ])

  const addLinha = () => {
    setLinhas(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        numero_patrimonial: '',
        numero_formato_antigo: false,
        sem_numeracao: false,
        localizacao: '',
      },
    ])
  }

  const removeLinha = (index: number) => {
    const newLinhas = [...linhas]
    newLinhas.splice(index, 1)
    setLinhas(newLinhas)
  }

  const handleSave = async () => {
    if (!linhas.length) {
      toast.error('Adicione ao menos um bem')
      return
    }

    setLoading(true)
    try {
      await bemService.createMulti({
        ...formBase,
        multi_payload: linhas,
      })

      toast.success('Bens criados com sucesso')
      navigate('/bens-patrimoniais')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* BREADCRUMB */}
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Boxes },
          { label: 'Bens Patrimoniais', to: '/bens-patrimoniais' },
          { label: 'Adicionar Bem Patrimonial', isActive: true },
        ]}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#363636]">
          Adicionar Bem Patrimonial
        </h1>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/bens-patrimoniais')}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#00703C] hover:bg-[#005a30] text-white"
          >
            Salvar
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-8">

        {/* CAMPOS BASE */}
        <div className="grid grid-cols-2 gap-6">
          <Input
            className={INPUT_CLASS}
            placeholder="Unidade Administrativa"
            value={formBase.unidade_administrativa}
            onChange={(e) =>
              setFormBase({ ...formBase, unidade_administrativa: e.target.value })
            }
          />

          <Input
            className={INPUT_CLASS}
            placeholder="Nome do Bem"
            value={formBase.nome}
            onChange={(e) =>
              setFormBase({ ...formBase, nome: e.target.value })
            }
          />
        </div>

        <Textarea
          className="min-h-[140px]"
          placeholder="Descrição do Bem"
          value={formBase.descricao}
          onChange={(e) =>
            setFormBase({ ...formBase, descricao: e.target.value })
          }
        />

        <div className="grid grid-cols-3 gap-6">
          <Input
            className={INPUT_CLASS}
            placeholder="Valor unitário"
            value={formBase.valor_unitario}
            onChange={(e) =>
              setFormBase({ ...formBase, valor_unitario: e.target.value })
            }
          />

          <Input
            className={INPUT_CLASS}
            placeholder="Marca"
            value={formBase.marca}
            onChange={(e) =>
              setFormBase({ ...formBase, marca: e.target.value })
            }
          />

          <Input
            className={INPUT_CLASS}
            placeholder="Modelo"
            value={formBase.modelo}
            onChange={(e) =>
              setFormBase({ ...formBase, modelo: e.target.value })
            }
          />
        </div>

        <Input
          className={INPUT_CLASS}
          placeholder="Número do processo de incorporação"
          value={formBase.numero_processo}
          onChange={(e) =>
            setFormBase({ ...formBase, numero_processo: e.target.value })
          }
        />

        {/* MULTI INLINE */}
        <div className="space-y-4">

          <div>
            <h2 className="text-sm font-semibold text-[#00703C]">
              Adicionar Bens Patrimoniais
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Para adicionar mais bens, clique no botão + ao final da linha.
              Caso não seja necessário o novo item do bem, ele pode ser removido no botão da lixeira.
            </p>
          </div>

          
          {linhas.map((linha, index) => (
            <LinhaBemRow
              key={linha.id}
              linha={linha}
              index={index}
              linhas={linhas}
              setLinhas={setLinhas}
              removeLinha={removeLinha}
              addLinha={addLinha}
              isLast={index === linhas.length - 1}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}