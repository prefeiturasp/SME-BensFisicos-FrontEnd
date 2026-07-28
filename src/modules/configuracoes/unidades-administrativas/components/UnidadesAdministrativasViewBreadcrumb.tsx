import { Building2 } from 'lucide-react';
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
        { label: 'Unidades Administrativas', icon: Building2, to: '/unidades-administrativas' },
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