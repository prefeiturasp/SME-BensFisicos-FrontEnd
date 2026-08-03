import { Landmark } from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';

interface UnidadesOrcamentariasViewBreadcrumbProps {
  isEditing: boolean;
}

export function UnidadesOrcamentariasViewBreadcrumb({
  isEditing,
}: Readonly<UnidadesOrcamentariasViewBreadcrumbProps>) {
  return (
    <AppBreadcrumb
      items={[
        { label: 'Unidades Orçamentárias', icon: Landmark, to: '/unidades-orcamentarias' },
        {
          label: isEditing ? 'Editar Unidade Orçamentária' : 'Visualizar Unidade Orçamentária',
          isActive: true,
        },
      ]}
    />
  );
}