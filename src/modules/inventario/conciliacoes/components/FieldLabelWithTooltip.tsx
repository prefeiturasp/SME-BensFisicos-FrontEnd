import { CircleHelp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HELPER_BUTTON_CLASS,
  LABEL_CLASS,
  LABEL_WITH_TOOLTIP_ROW_CLASS,
  REQUIRED_ASTERISK_CLASS,
  OPTIONAL_LABEL_CLASS,
} from '../utils/form-styles';

interface FieldLabelWithTooltipProps {
  htmlFor?: string;
  label: string;
  tooltip: string;
  required?: boolean;
  optional?: boolean;
}

export function FieldLabelWithTooltip({
  htmlFor,
  label,
  tooltip,
  required = false,
  optional = false,
}: Readonly<FieldLabelWithTooltipProps>) {
  return (
    <div className={LABEL_WITH_TOOLTIP_ROW_CLASS}>
      <label htmlFor={htmlFor} className={LABEL_CLASS}>
        {label}
        {required && (
          <span className={REQUIRED_ASTERISK_CLASS} aria-hidden='true'>
            *
          </span>
        )}
        {optional && <span className={OPTIONAL_LABEL_CLASS}>(opcional)</span>}
      </label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            className={HELPER_BUTTON_CLASS}
            aria-label={`Ajuda sobre ${label}`}
            tabIndex={-1}
          >
            <CircleHelp className='h-4 w-4' />
          </button>
        </TooltipTrigger>
        <TooltipContent side='top' sideOffset={6}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
