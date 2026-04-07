import { Settings } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

interface UnidadesAdministrativasViewBreadcrumbProps {
  isEditing: boolean;
}

export function UnidadesAdministrativasViewBreadcrumb({
  isEditing,
}: Readonly<UnidadesAdministrativasViewBreadcrumbProps>) {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Configurações', icon: Settings },
        { label: 'Unidades Administrativas', to: '/unidades-administrativas' },
        {
          label: isEditing
            ? 'Editar Unidade Administrativa'
            : 'Visualizar Unidade Administrativa',
          isActive: true,
        },
      ]}
    />
  );
}
