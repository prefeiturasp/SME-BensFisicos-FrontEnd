import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { authService } from '@/auth/auth.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SelectUaLoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selectedUaId, setSelectedUaId] = useState<number | null>(user?.ua_ativa?.id ?? null);

  const uas = useMemo(() => {
    const grupos = user?.opcoes_escopo?.grupos ?? [];
    return grupos.flatMap((grupo) => grupo.uas);
  }, [user?.opcoes_escopo?.grupos]);

  const onConfirm = async () => {
    if (!selectedUaId) return;
    setSaving(true);
    try {
      await authService.selecionarEscopo({ unidade_administrativa_id: selectedUaId });
      sessionStorage.removeItem('pending_user_selection');
      navigate('/home');
      if (import.meta.env.MODE !== 'test') window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100 p-6'>
      <Card className='w-full max-w-xl p-6 space-y-4'>
        <h1 className='text-xl font-bold text-gray-700'>Selecionar Unidade Administrativa</h1>
        <p className='text-sm text-gray-600'>Escolha a UA para atuar nesta sessão.</p>
        <div className='space-y-2'>
          {uas.map((ua) => (
            <label key={ua.id} className='flex items-center gap-2 text-sm'>
              <input
                type='radio'
                name='ua-login'
                checked={selectedUaId === ua.unidade_administrativa_id}
                onChange={() => setSelectedUaId(ua.unidade_administrativa_id)}
              />
              {ua.label}
            </label>
          ))}
        </div>
        <div className='flex justify-end'>
          <Button
            type='button'
            disabled={!selectedUaId || saving}
            onClick={onConfirm}
            className='bg-[#2F7D57] hover:bg-[#256947] text-white'
          >
            {saving ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
